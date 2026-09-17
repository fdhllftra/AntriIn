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
} from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, Booking, Service, Barber, BlockedSlot } from '../types';

const COLLECTIONS = {
  users: 'users',
  bookings: 'bookings',
  services: 'services',
  barbers: 'barbers',
  blockedSlots: 'blockedSlots',
};

export const createUserProfile = async (
  uid: string,
  profile: Omit<UserProfile, 'uid'>
): Promise<void> => {
  await setDoc(doc(db, COLLECTIONS.users, uid), {
    ...profile,
    createdAt: Date.now(),
  });
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const docRef = doc(db, COLLECTIONS.users, uid);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { uid: docSnap.id, ...docSnap.data() } as UserProfile;
};

export const updateUserProfile = async (
  uid: string,
  data: Partial<UserProfile>
): Promise<void> => {
  await updateDoc(doc(db, COLLECTIONS.users, uid), data);
};

export const getServices = async (): Promise<Service[]> => {
  const q = query(collection(db, COLLECTIONS.services), where('isActive', '==', true));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Service);
};

export const getBarbers = async (): Promise<Barber[]> => {
  const q = query(collection(db, COLLECTIONS.barbers), where('isActive', '==', true));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Barber);
};

export const createBooking = async (booking: Omit<Booking, 'id' | 'createdAt'>): Promise<string> => {
  const bookingRef = doc(collection(db, COLLECTIONS.bookings));
  await setDoc(bookingRef, {
    ...booking,
    id: bookingRef.id,
    createdAt: Date.now(),
  });
  return bookingRef.id;
};

export const getBookingsByDate = async (date: string): Promise<Booking[]> => {
  const q = query(
    collection(db, COLLECTIONS.bookings),
    where('date', '==', date),
    where('status', 'in', ['Menunggu', 'Selesai'])
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Booking);
};

export const getBookingsByCustomer = async (customerId: string): Promise<Booking[]> => {
  const q = query(
    collection(db, COLLECTIONS.bookings),
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Booking);
};

export const updateBookingStatus = async (
  bookingId: string,
  status: 'Menunggu' | 'Selesai' | 'Batal'
): Promise<void> => {
  await updateDoc(doc(db, COLLECTIONS.bookings, bookingId), {
    status,
    updatedAt: Date.now(),
  });
};

export const getBlockedSlots = async (date: string): Promise<BlockedSlot[]> => {
  const q = query(collection(db, COLLECTIONS.blockedSlots), where('date', '==', date));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as BlockedSlot);
};

export const blockSlot = async (date: string, timeSlot: string): Promise<void> => {
  const slotRef = doc(collection(db, COLLECTIONS.blockedSlots));
  await setDoc(slotRef, {
    id: slotRef.id,
    date,
    timeSlot,
    createdAt: Date.now(),
  });
};

export const unblockSlot = async (slotId: string): Promise<void> => {
  const { deleteDoc } = await import('firebase/firestore');
  await deleteDoc(doc(db, COLLECTIONS.blockedSlots, slotId));
};