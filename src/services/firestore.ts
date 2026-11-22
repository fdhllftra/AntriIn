import {
  getDoc,
  doc,
  setDoc,
  query,
  collection,
  where,
  getDocs,
  orderBy,
  limit,
  deleteDoc,
  writeBatch,
  runTransaction,
  Firestore,
} from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, Booking, Service, Barber, BlockedSlot, Review, BookingStatus } from '../types';
import * as localDb from './localDatabase';

const getDb = (): Firestore | null => db;

const COLLECTIONS = {
  users: 'users',
  bookings: 'bookings',
  services: 'services',
  barbers: 'barbers',
  blockedSlots: 'blockedSlots',
  reviews: 'reviews',
  slotLocks: 'slotLocks',
};

/**
 * ID deterministik untuk kunci slot. Dipakai bersama oleh klien dan script backfill
 * agar satu (tanggal, kapster, jam) hanya memiliki satu kunci aktif.
 */
export const buildSlotLockId = (
  date: string,
  barberId: string,
  timeSlot: string
): string => `${date}_${barberId}_${timeSlot.replace(/:/g, '-')}`;

/** Data lokal perangkat tidak tepercaya: role selalu diturunkan menjadi customer. */
const trustLocalProfile = (profile: UserProfile | null): UserProfile | null =>
  profile ? { ...profile, role: 'customer' as const } : null;

const cleanFirestoreData = (obj: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
};

export const createUserProfile = async (
  uid: string,
  profile: Omit<UserProfile, 'uid'>
): Promise<void> => {
  const database = getDb();
  if (database) {
    const dataToSave = cleanFirestoreData({
      ...profile,
      createdAt: Date.now(),
    });
    // Firebase adalah sumber kebenaran: kesalahan harus terlihat oleh pemanggil.
    await setDoc(doc(database, COLLECTIONS.users, uid), dataToSave, { merge: true });
  }
  await localDb.saveLocalUserProfile(uid, profile).catch(() => {});
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const database = getDb();
  if (database) {
    try {
      const docRef = doc(database, COLLECTIONS.users, uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const remoteData = { uid: docSnap.id, ...docSnap.data() } as UserProfile;
        await localDb.saveLocalUserProfile(uid, remoteData).catch(() => { });
        return remoteData;
      }
      // Jika profil belum ada di Firestore tapi ada di local DB, sinkronkan ke Firestore.
      // Role selalu dipaksa 'customer': klien tidak boleh membuat profil admin.
      const localData = await localDb.getLocalUserProfile(uid);
      if (localData) {
        const safeLocalData = { ...localData, role: 'customer' as const };
        await setDoc(docRef, cleanFirestoreData(safeLocalData), { merge: true }).catch(() => { });
        return safeLocalData;
      }
    } catch (err) {
      console.warn('[Firestore] Remote getUserProfile failed, falling back to local DB:', err);
      return trustLocalProfile(await localDb.getLocalUserProfile(uid));
    }
  }
  return trustLocalProfile(await localDb.getLocalUserProfile(uid));
};

export const updateUserProfile = async (
  uid: string,
  data: Partial<UserProfile>
): Promise<void> => {
  const database = getDb();
  if (database) {
    const cleanedData = cleanFirestoreData(data as Record<string, any>);
    await setDoc(doc(database, COLLECTIONS.users, uid), cleanedData, { merge: true });
  }
  await localDb.saveLocalUserProfile(uid, data).catch(() => {});
};

export const getServices = async (): Promise<Service[]> => {
  const database = getDb();
  if (database) {
    try {
      const q = query(collection(database, COLLECTIONS.services), where('isActive', '==', true));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Service);
      }
    } catch (err) {
      console.warn('[Firestore] Remote getServices failed, falling back to local DB:', err);
    }
  }
  return localDb.getLocalServices();
};

export const getBarbers = async (): Promise<Barber[]> => {
  const database = getDb();
  if (database) {
    try {
      const q = query(collection(database, COLLECTIONS.barbers), where('isActive', '==', true));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Barber);
      }
    } catch (err) {
      console.warn('[Firestore] Remote getBarbers failed, falling back to local DB:', err);
    }
  }
  return localDb.getLocalBarbers();
};

export const createBooking = async (
  booking: Omit<Booking, 'id' | 'createdAt'>,
  bookedSlots: string[] = []
): Promise<string> => {
  if (bookedSlots.includes(booking.timeSlot)) {
    throw new Error('SLOT_TAKEN');
  }

  const database = getDb();
  if (!database) {
    return localDb.createLocalBooking(booking, bookedSlots);
  }

  const bookingRef = doc(collection(database, COLLECTIONS.bookings));
  const fullBooking: Booking = {
    ...booking,
    id: bookingRef.id,
    createdAt: Date.now(),
  };
  const slotLockId = buildSlotLockId(booking.date, booking.barberId, booking.timeSlot);
  const slotLockRef = doc(database, COLLECTIONS.slotLocks, slotLockId);

  // Booking dan kunci slot ditulis dalam satu transaksi: jika kunci sudah dipakai
  // pelanggan lain, seluruh transaksi gagal dan slot tidak ikut terpesan.
  await runTransaction(database, async (transaction) => {
    const existingLock = await transaction.get(slotLockRef);
    if (existingLock.exists()) {
      throw new Error('SLOT_TAKEN');
    }
    transaction.set(bookingRef, cleanFirestoreData(fullBooking));
    transaction.set(
      slotLockRef,
      cleanFirestoreData({
        id: slotLockId,
        date: booking.date,
        timeSlot: booking.timeSlot,
        barberId: booking.barberId,
        customerId: booking.customerId,
        createdAt: Date.now(),
      })
    );
  });

  // Lokal hanya cache setelah penulisan Firebase berhasil.
  await localDb.saveLocalBooking(fullBooking).catch(() => {});
  return bookingRef.id;
};

export const getBookingsByDate = async (date: string): Promise<Booking[]> => {
  const database = getDb();
  if (database) {
    try {
      // Query dengan single where('date', '==', date) agar tidak membutuhkan composite index
      const q = query(
        collection(database, COLLECTIONS.bookings),
        where('date', '==', date)
      );
      const querySnapshot = await getDocs(q);
      const allBookings = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking);
      const filtered = allBookings.filter(
        (b) => b.status === 'Menunggu' || b.status === 'Selesai'
      );
      for (const b of allBookings) {
        await localDb.saveLocalBooking(b).catch(() => { });
      }
      return filtered;
    } catch (err) {
      console.warn('[Firestore] Remote getBookingsByDate failed, falling back to local DB:', err);
    }
  }
  return localDb.getLocalBookingsByDate(date);
};

export const getBookedSlots = async (
  barberId: string,
  date: string
): Promise<string[]> => {
  const database = getDb();
  if (database) {
    try {
      // Koleksi slotLocks sengaja dibaca (bukan bookings) agar pelanggan tidak
      // membutuhkan izin membaca booking milik pengguna lain.
      const q = query(
        collection(database, COLLECTIONS.slotLocks),
        where('date', '==', date)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map((d) => d.data() as { barberId?: string; timeSlot?: string })
        .filter((lock) => lock.barberId === barberId && typeof lock.timeSlot === 'string')
        .map((lock) => lock.timeSlot as string);
    } catch (err) {
      console.warn('[Firestore] Remote getBookedSlots failed, falling back to local DB:', err);
    }
  }
  const bookings = await localDb.getLocalBookingsByDate(date);
  return bookings
    .filter((b) => b.barberId === barberId && (b.status === 'Menunggu' || b.status === 'Selesai'))
    .map((b) => b.timeSlot);
};

export const getBookingsByCustomer = async (customerId: string): Promise<Booking[]> => {
  const database = getDb();
  if (database) {
    try {
      // Query dengan filter customerId dan sorting in-memory untuk menghindari error composite index Firestore
      const q = query(
        collection(database, COLLECTIONS.bookings),
        where('customerId', '==', customerId)
      );
      const querySnapshot = await getDocs(q);
      const bookings = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking);
      const sorted = bookings
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        .slice(0, 50);

      // Sinkronkan ke local database agar cache data booking tersimpan
      for (const b of sorted) {
        await localDb.saveLocalBooking(b).catch(() => { });
      }

      return sorted;
    } catch (err) {
      console.warn('[Firestore] Remote getBookingsByCustomer failed, falling back to local DB:', err);
    }
  }
  return localDb.getLocalBookingsByCustomer(customerId);
};

export const updateBookingStatus = async (
  bookingId: string,
  status: BookingStatus
): Promise<void> => {
  const database = getDb();
  if (!database) {
    await localDb.updateLocalBookingStatus(bookingId, status);
    return;
  }

  const bookingRef = doc(database, COLLECTIONS.bookings, bookingId);
  const snapshot = await getDoc(bookingRef);
  const batch = writeBatch(database);
  batch.update(bookingRef, {
    status,
    updatedAt: Date.now(),
  });

  // Membatalkan booking harus membebaskan kunci slot di transaksi yang sama.
  if (status === 'Batal' && snapshot.exists()) {
    const booking = snapshot.data() as Booking;
    batch.delete(
      doc(
        database,
        COLLECTIONS.slotLocks,
        buildSlotLockId(booking.date, booking.barberId, booking.timeSlot)
      )
    );
  }
  await batch.commit();
  await localDb.updateLocalBookingStatus(bookingId, status).catch(() => {});
};

export const getBlockedSlots = async (date: string): Promise<BlockedSlot[]> => {
  const database = getDb();
  if (database) {
    try {
      const q = query(collection(database, COLLECTIONS.blockedSlots), where('date', '==', date));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as BlockedSlot);
    } catch (err) {
      console.warn('[Firestore] Remote getBlockedSlots failed, falling back to local DB:', err);
    }
  }
  return localDb.getLocalBlockedSlots(date);
};

export const blockSlot = async (date: string, timeSlot: string): Promise<void> => {
  const database = getDb();
  if (!database) {
    await localDb.createLocalBlockedSlot(date, timeSlot);
    return;
  }

  const slotRef = doc(collection(database, COLLECTIONS.blockedSlots));
  await setDoc(slotRef, {
    id: slotRef.id,
    date,
    timeSlot,
    createdAt: Date.now(),
  });
  await localDb.createLocalBlockedSlot(date, timeSlot).catch(() => {});
};

export const unblockSlot = async (slotId: string): Promise<void> => {
  const database = getDb();
  if (!database) {
    await localDb.deleteLocalBlockedSlot(slotId);
    return;
  }

  await deleteDoc(doc(database, COLLECTIONS.blockedSlots, slotId));
  await localDb.deleteLocalBlockedSlot(slotId).catch(() => {});
};

export const createReview = async (
  review: Omit<Review, 'id' | 'createdAt'>
): Promise<string> => {
  const database = getDb();
  if (!database) {
    return localDb.createLocalReview(review);
  }

  const reviewRef = doc(collection(database, COLLECTIONS.reviews));
  const cleanReview = cleanFirestoreData({
    ...review,
    id: reviewRef.id,
    createdAt: Date.now(),
  });
  await setDoc(reviewRef, cleanReview);
  await localDb.createLocalReview(cleanReview as Omit<Review, 'id' | 'createdAt'>).catch(() => {});
  return reviewRef.id;
};

export const getReviewByBooking = async (bookingId: string): Promise<Review | null> => {
  const database = getDb();
  if (database) {
    try {
      const q = query(
        collection(database, COLLECTIONS.reviews),
        where('bookingId', '==', bookingId),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        return { id: docSnap.id, ...docSnap.data() } as Review;
      }
    } catch (err) {
      console.warn('[Firestore] Remote getReviewByBooking failed:', err);
    }
  }
  return localDb.getLocalReviewByBooking(bookingId);
};

export const getReviewsByBarber = async (barberId: string): Promise<Review[]> => {
  const database = getDb();
  if (database) {
    try {
      const q = query(collection(database, COLLECTIONS.reviews), where('barberId', '==', barberId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Review);
    } catch (err) {
      console.warn('[Firestore] Remote getReviewsByBarber failed, falling back to local DB:', err);
    }
  }
  return localDb.getLocalReviewsByBarber(barberId);
};