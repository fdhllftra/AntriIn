import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  DocumentData,
  Query,
} from 'firebase/firestore';
import { db } from './firebase';
import * as localDb from './localDatabase';
import { Barber, BlockedSlot, Booking, Review, Service, UserProfile } from '../types';

export type Unsubscribe = () => void;
const noop: Unsubscribe = () => {};

type ListHandler<T> = (items: T[]) => void;
type DocHandler<T> = (item: T | null) => void;

/** Fallback lokal tidak pernah dipercaya untuk peran admin. */
const sanitizeLocalProfile = (profile: UserProfile | null): UserProfile | null =>
  profile ? { ...profile, role: 'customer' as const } : null;

/**
 * Berlangganan query Firestore. Data lokal dipakai hanya sebagai cache saat
 * Firestore gagal/diblokir; setiap perubahan remote langsung diteruskan ke UI.
 */
const subscribeQuery = <T>(
  source: Query<DocumentData> | null,
  onData: ListHandler<T>,
  loadCache: () => Promise<T[]>,
  saveCache?: (items: T[]) => Promise<void>,
  onError?: (error: unknown) => void
): Unsubscribe => {
  if (!db || !source) {
    loadCache().then(onData).catch(() => onData([]));
    return noop;
  }

  return onSnapshot(
    source,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
      onData(items);
      if (saveCache) saveCache(items).catch(() => {});
    },
    (error) => {
      console.warn('[Realtime] listener gagal, memakai cache lokal:', error);
      loadCache().then(onData).catch(() => onData([]));
      if (onError) onError(error);
    }
  );
};

export const subscribeToServices = (
  onData: ListHandler<Service>,
  onError?: (error: unknown) => void
): Unsubscribe =>
  subscribeQuery<Service>(
    db ? query(collection(db, 'services'), where('isActive', '==', true)) : null,
    onData,
    localDb.getLocalServices,
    undefined,
    onError
  );

export const subscribeToBarbers = (
  onData: ListHandler<Barber>,
  onError?: (error: unknown) => void
): Unsubscribe =>
  subscribeQuery<Barber>(
    db ? query(collection(db, 'barbers'), where('isActive', '==', true)) : null,
    onData,
    localDb.getLocalBarbers,
    undefined,
    onError
  );

/** Dipakai admin; aturan Firestore mengizinkan read booking penuh hanya untuk admin. */
export const subscribeToBookingsByDate = (
  date: string,
  onData: ListHandler<Booking>,
  onError?: (error: unknown) => void
): Unsubscribe => {
  const filtered = (items: Booking[]) =>
    items.filter((b) => b.status === 'Menunggu' || b.status === 'Selesai');

  return subscribeQuery<Booking>(
    db ? query(collection(db, 'bookings'), where('date', '==', date)) : null,
    (items) => onData(filtered(items)),
    async () => filtered(await localDb.getLocalBookingsByDate(date)),
    (items) => Promise.all(items.map((b) => localDb.saveLocalBooking(b))).then(() => {}),
    onError
  );
};

export const subscribeToBookingsByCustomer = (
  customerId: string | null | undefined,
  onData: ListHandler<Booking>,
  onError?: (error: unknown) => void
): Unsubscribe => {
  if (!customerId) {
    onData([]);
    return noop;
  }

  const sorted = (items: Booking[]) =>
    [...items].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 50);

  return subscribeQuery<Booking>(
    db
      ? query(collection(db, 'bookings'), where('customerId', '==', customerId))
      : null,
    (items) => onData(sorted(items)),
    async () => sorted(await localDb.getLocalBookingsByCustomer(customerId)),
    (items) => Promise.all(items.map((b) => localDb.saveLocalBooking(b))).then(() => {}),
    onError
  );
};

interface SlotLockRecord {
  barberId?: string;
  timeSlot?: string;
}

/**
 * Slot terpesan untuk satu kapster/tanggal. Membaca `slotLocks` (bukan `bookings`)
 * membuat listener tetap bekerja untuk pelanggan: aturan Firestore mengizinkan
 * semua pengguna yang login membaca ringkasan slot tanpa membuka data booking
 * pengguna lain. Cache lokal hanya dipakai saat Firestore tidak tersedia.
 */
export const subscribeToBookedSlots = (
  barberId: string,
  date: string,
  onData: ListHandler<string>,
  onError?: (error: unknown) => void
): Unsubscribe => {
  const extract = (items: SlotLockRecord[]) =>
    items
      .filter((lock) => lock.barberId === barberId && typeof lock.timeSlot === 'string')
      .map((lock) => lock.timeSlot as string);

  return subscribeQuery<SlotLockRecord>(
    db ? query(collection(db, 'slotLocks'), where('date', '==', date)) : null,
    (items) => onData(extract(items)),
    async () => {
      const bookings = await localDb.getLocalBookingsByDate(date);
      return bookings
        .filter((b) => b.status === 'Menunggu' || b.status === 'Selesai')
        .map((b) => ({ barberId: b.barberId, timeSlot: b.timeSlot }));
    },
    undefined,
    onError
  );
};

export const subscribeToBlockedSlots = (
  date: string,
  onData: ListHandler<BlockedSlot>,
  onError?: (error: unknown) => void
): Unsubscribe =>
  subscribeQuery<BlockedSlot>(
    db ? query(collection(db, 'blockedSlots'), where('date', '==', date)) : null,
    onData,
    localDb.getLocalBlockedSlots.bind(null, date),
    undefined,
    onError
  );

export const subscribeToReviews = (
  onData: ListHandler<Review>,
  onError?: (error: unknown) => void
): Unsubscribe =>
  subscribeQuery<Review>(
    db ? query(collection(db, 'reviews')) : null,
    onData,
    async () => {
      // Cache lokal per barber digabungkan; duplikat dibuang berdasarkan id.
      const local = await localDb.getLocalReviews();
      return local;
    },
    undefined,
    onError
  );

export const subscribeToUserProfile = (
  uid: string,
  onData: DocHandler<UserProfile>,
  onError?: (error: unknown) => void
): Unsubscribe => {
  if (!db) {
    localDb.getLocalUserProfile(uid)
      .then((profile) => onData(sanitizeLocalProfile(profile)))
      .catch(() => onData(null));
    return noop;
  }

  return onSnapshot(
    doc(db, 'users', uid),
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }
      onData({ uid: snapshot.id, ...snapshot.data() } as UserProfile);
    },
    (error) => {
      console.warn('[Realtime] profile listener gagal, memakai cache lokal:', error);
      localDb.getLocalUserProfile(uid)
        .then((profile) => onData(sanitizeLocalProfile(profile)))
        .catch(() => onData(null));
      if (onError) onError(error);
    }
  );
};
