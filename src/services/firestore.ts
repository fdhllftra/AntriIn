import {
  getDoc,
  doc,
  setDoc,
  updateDoc,
  query,
  collection,
  where,
  getDocs,
  orderBy,
  limit,
  deleteDoc,
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
};

export const createUserProfile = async (
  uid: string,
  profile: Omit<UserProfile, 'uid'>
): Promise<void> => {
  // Always update local database for guaranteed offline/testing availability
  await localDb.saveLocalUserProfile(uid, profile);

  const database = getDb();
  if (database) {
    try {
      await setDoc(doc(database, COLLECTIONS.users, uid), {
        ...profile,
        createdAt: Date.now(),
      });
    } catch (err) {
      console.warn('[Firestore] Failed to save profile to remote, kept locally:', err);
    }
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const database = getDb();
  if (database) {
    try {
      const docRef = doc(database, COLLECTIONS.users, uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const remoteData = { uid: docSnap.id, ...docSnap.data() } as UserProfile;
        await localDb.saveLocalUserProfile(uid, remoteData).catch(() => {});
        return remoteData;
      }
    } catch (err) {
      console.warn('[Firestore] Remote getUserProfile failed, falling back to local DB:', err);
    }
  }
  return localDb.getLocalUserProfile(uid);
};

export const updateUserProfile = async (
  uid: string,
  data: Partial<UserProfile>
): Promise<void> => {
  await localDb.saveLocalUserProfile(uid, data);
  const database = getDb();
  if (database) {
    try {
      await updateDoc(doc(database, COLLECTIONS.users, uid), data);
    } catch (err) {
      console.warn('[Firestore] Failed remote updateUserProfile:', err);
    }
  }
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
  if (database) {
    try {
      const bookingRef = doc(collection(database, COLLECTIONS.bookings));
      await setDoc(bookingRef, {
        ...booking,
        id: bookingRef.id,
        createdAt: Date.now(),
      });
      // Also cache to local database
      await localDb.createLocalBooking({ ...booking }, []);
      return bookingRef.id;
    } catch (err) {
      console.warn('[Firestore] Remote createBooking failed, saving to local DB:', err);
    }
  }

  return localDb.createLocalBooking(booking, bookedSlots);
};

export const getBookingsByDate = async (date: string): Promise<Booking[]> => {
  const database = getDb();
  if (database) {
    try {
      const q = query(
        collection(database, COLLECTIONS.bookings),
        where('date', '==', date),
        where('status', 'in', ['Menunggu', 'Selesai'])
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking);
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
  const bookings = await getBookingsByDate(date);
  return bookings
    .filter((b) => b.barberId === barberId && (b.status === 'Menunggu' || b.status === 'Selesai'))
    .map((b) => b.timeSlot);
};

export const getBookingsByCustomer = async (customerId: string): Promise<Booking[]> => {
  const database = getDb();
  if (database) {
    try {
      const q = query(
        collection(database, COLLECTIONS.bookings),
        where('customerId', '==', customerId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking);
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
  // Always update locally
  await localDb.updateLocalBookingStatus(bookingId, status);

  const database = getDb();
  if (database) {
    try {
      await updateDoc(doc(database, COLLECTIONS.bookings, bookingId), {
        status,
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.warn('[Firestore] Remote updateBookingStatus failed:', err);
    }
  }
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
  await localDb.createLocalBlockedSlot(date, timeSlot);
  const database = getDb();
  if (database) {
    try {
      const slotRef = doc(collection(database, COLLECTIONS.blockedSlots));
      await setDoc(slotRef, {
        id: slotRef.id,
        date,
        timeSlot,
        createdAt: Date.now(),
      });
    } catch (err) {
      console.warn('[Firestore] Remote blockSlot failed:', err);
    }
  }
};

export const unblockSlot = async (slotId: string): Promise<void> => {
  await localDb.deleteLocalBlockedSlot(slotId);
  const database = getDb();
  if (database) {
    try {
      await deleteDoc(doc(database, COLLECTIONS.blockedSlots, slotId));
    } catch (err) {
      console.warn('[Firestore] Remote unblockSlot failed:', err);
    }
  }
};

export const createReview = async (
  review: Omit<Review, 'id' | 'createdAt'>
): Promise<string> => {
  const database = getDb();
  if (database) {
    try {
      const reviewRef = doc(collection(database, COLLECTIONS.reviews));
      await setDoc(reviewRef, {
        ...review,
        id: reviewRef.id,
        createdAt: Date.now(),
      });
      await localDb.createLocalReview(review);
      return reviewRef.id;
    } catch (err) {
      console.warn('[Firestore] Remote createReview failed, saving locally:', err);
    }
  }
  return localDb.createLocalReview(review);
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