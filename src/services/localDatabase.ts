import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserProfile,
  Service,
  Barber,
  Booking,
  BlockedSlot,
  Review,
  BookingStatus,
} from '../types';
import rawData from '../../data/test-database.json';

const STORAGE_KEYS = {
  INITIALIZED: '@antriin_db_initialized_v2',
  USERS: '@antriin_db_users',
  SERVICES: '@antriin_db_services',
  BARBERS: '@antriin_db_barbers',
  BOOKINGS: '@antriin_db_bookings',
  BLOCKED_SLOTS: '@antriin_db_blocked_slots',
  REVIEWS: '@antriin_db_reviews',
};

const getDateString = (relativeDays: number = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() + relativeDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const initializeLocalDatabase = async (): Promise<void> => {
  try {
    const isInitialized = await AsyncStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (isInitialized === 'true') {
      return;
    }

    const now = Date.now();

    // Map initial services
    const services: Service[] = rawData.services.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      price: s.price,
      durationMinutes: s.durationMinutes,
      isActive: s.isActive,
      createdAt: now,
    }));
    const serviceMap = new Map(services.map((s) => [s.id, s]));

    // Map initial barbers
    const barbers: Barber[] = rawData.barbers.map((b) => ({
      id: b.id,
      name: b.name,
      specialty: b.specialty,
      photoURL: b.photoURL,
      isActive: b.isActive,
      createdAt: now,
    }));

    // Map initial users
    const users: UserProfile[] = rawData.users.map((u) => ({
      uid: u.uid,
      name: u.name,
      email: u.email,
      phone: u.phone,
      photoURL: u.photoURL,
      role: u.role as 'customer' | 'admin',
      createdAt: now,
    }));

    // Map initial bookings
    const bookings: Booking[] = rawData.bookings.map((b) => ({
      id: b.id,
      customerId: b.customerId,
      customerName: b.customerName,
      customerPhone: b.customerPhone,
      barberId: b.barberId,
      barberName: b.barberName,
      date: getDateString(b.relativeDays || 0),
      timeSlot: b.timeSlot,
      services: (b.serviceIds || [])
        .map((id) => serviceMap.get(id))
        .filter((s): s is Service => !!s),
      totalPrice: b.totalPrice,
      status: b.status as BookingStatus,
      createdAt:
        now -
        (b.relativeDays && b.relativeDays < 0
          ? Math.abs(b.relativeDays) * 86400000
          : 0),
    }));

    // Map initial reviews
    const reviews: Review[] = rawData.reviews.map((r) => ({
      id: r.id,
      bookingId: r.bookingId,
      customerId: r.customerId,
      barberId: r.barberId,
      rating: r.rating,
      comment: r.comment,
      createdAt: now,
    }));

    // Map initial blocked slots
    const blockedSlots: BlockedSlot[] = rawData.blockedSlots.map((bs) => ({
      id: bs.id,
      date: getDateString(bs.relativeDays || 0),
      timeSlot: bs.timeSlot,
      reason: bs.reason,
      createdAt: now,
    }));

    await AsyncStorage.multiSet([
      [STORAGE_KEYS.SERVICES, JSON.stringify(services)],
      [STORAGE_KEYS.BARBERS, JSON.stringify(barbers)],
      [STORAGE_KEYS.USERS, JSON.stringify(users)],
      [STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings)],
      [STORAGE_KEYS.REVIEWS, JSON.stringify(reviews)],
      [STORAGE_KEYS.BLOCKED_SLOTS, JSON.stringify(blockedSlots)],
      [STORAGE_KEYS.INITIALIZED, 'true'],
    ]);
  } catch (error) {
    console.warn('Failed to initialize local database:', error);
  }
};

// Users
export const getLocalUsers = async (): Promise<UserProfile[]> => {
  await initializeLocalDatabase();
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
  return raw ? JSON.parse(raw) : [];
};

export const getLocalUserProfile = async (
  uid: string
): Promise<UserProfile | null> => {
  const users = await getLocalUsers();
  return users.find((u) => u.uid === uid) || null;
};

export const findLocalUserByPhone = async (
  phone: string
): Promise<UserProfile | null> => {
  const cleanInput = phone.replace(/\D/g, '');
  const users = await getLocalUsers();
  return (
    users.find((u) => {
      const cleanU = (u.phone || '').replace(/\D/g, '');
      return cleanU && (cleanU === cleanInput || cleanU.endsWith(cleanInput) || cleanInput.endsWith(cleanU));
    }) || null
  );
};

export const saveLocalUserProfile = async (
  uid: string,
  profile: Partial<UserProfile>
): Promise<UserProfile> => {
  const users = await getLocalUsers();
  const existingIndex = users.findIndex((u) => u.uid === uid);
  let updatedUser: UserProfile;

  if (existingIndex >= 0) {
    updatedUser = {
      ...users[existingIndex],
      ...profile,
      uid,
    };
    users[existingIndex] = updatedUser;
  } else {
    updatedUser = {
      uid,
      name: profile.name || 'Pengguna',
      email: profile.email || '',
      phone: profile.phone || '',
      role: profile.role || 'customer',
      photoURL: profile.photoURL,
      createdAt: profile.createdAt || Date.now(),
    };
    users.push(updatedUser);
  }

  await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  return updatedUser;
};

// Services
export const getLocalServices = async (): Promise<Service[]> => {
  await initializeLocalDatabase();
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.SERVICES);
  const services: Service[] = raw ? JSON.parse(raw) : [];
  return services.filter((s) => s.isActive);
};

// Barbers
export const getLocalBarbers = async (): Promise<Barber[]> => {
  await initializeLocalDatabase();
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.BARBERS);
  const barbers: Barber[] = raw ? JSON.parse(raw) : [];
  return barbers.filter((b) => b.isActive);
};

// Bookings
export const getLocalBookings = async (): Promise<Booking[]> => {
  await initializeLocalDatabase();
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.BOOKINGS);
  return raw ? JSON.parse(raw) : [];
};

export const getLocalBookingsByDate = async (date: string): Promise<Booking[]> => {
  const bookings = await getLocalBookings();
  return bookings.filter(
    (b) => b.date === date && (b.status === 'Menunggu' || b.status === 'Selesai')
  );
};

export const getLocalBookingsByCustomer = async (
  customerId: string
): Promise<Booking[]> => {
  const bookings = await getLocalBookings();
  return bookings
    .filter((b) => b.customerId === customerId)
    .sort((a, b) => b.createdAt - a.createdAt);
};

export const createLocalBooking = async (
  booking: Omit<Booking, 'id' | 'createdAt'>,
  bookedSlots: string[] = []
): Promise<string> => {
  if (bookedSlots.includes(booking.timeSlot)) {
    throw new Error('SLOT_TAKEN');
  }

  const bookings = await getLocalBookings();
  const newId = `booking-local-${Date.now()}`;
  const newBooking: Booking = {
    ...booking,
    id: newId,
    createdAt: Date.now(),
  };

  bookings.unshift(newBooking);
  await AsyncStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  return newId;
};

export const updateLocalBookingStatus = async (
  bookingId: string,
  status: BookingStatus
): Promise<void> => {
  const bookings = await getLocalBookings();
  const updated = bookings.map((b) =>
    b.id === bookingId ? { ...b, status, updatedAt: Date.now() } : b
  );
  await AsyncStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));
};

// Blocked Slots
export const getLocalBlockedSlots = async (
  date: string
): Promise<BlockedSlot[]> => {
  await initializeLocalDatabase();
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.BLOCKED_SLOTS);
  const slots: BlockedSlot[] = raw ? JSON.parse(raw) : [];
  return slots.filter((s) => s.date === date);
};

export const createLocalBlockedSlot = async (
  date: string,
  timeSlot: string,
  reason?: string
): Promise<void> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.BLOCKED_SLOTS);
  const slots: BlockedSlot[] = raw ? JSON.parse(raw) : [];
  const newSlot: BlockedSlot = {
    id: `block-${Date.now()}`,
    date,
    timeSlot,
    reason: reason || 'Slot ditutup',
    createdAt: Date.now(),
  };
  slots.push(newSlot);
  await AsyncStorage.setItem(STORAGE_KEYS.BLOCKED_SLOTS, JSON.stringify(slots));
};

export const deleteLocalBlockedSlot = async (slotId: string): Promise<void> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.BLOCKED_SLOTS);
  const slots: BlockedSlot[] = raw ? JSON.parse(raw) : [];
  const updated = slots.filter((s) => s.id !== slotId);
  await AsyncStorage.setItem(STORAGE_KEYS.BLOCKED_SLOTS, JSON.stringify(updated));
};

// Reviews
export const getLocalReviewsByBarber = async (
  barberId: string
): Promise<Review[]> => {
  await initializeLocalDatabase();
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.REVIEWS);
  const reviews: Review[] = raw ? JSON.parse(raw) : [];
  return reviews.filter((r) => r.barberId === barberId);
};

export const getLocalReviewByBooking = async (
  bookingId: string
): Promise<Review | null> => {
  await initializeLocalDatabase();
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.REVIEWS);
  const reviews: Review[] = raw ? JSON.parse(raw) : [];
  return reviews.find((r) => r.bookingId === bookingId) || null;
};

export const createLocalReview = async (
  review: Omit<Review, 'id' | 'createdAt'>
): Promise<string> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.REVIEWS);
  const reviews: Review[] = raw ? JSON.parse(raw) : [];
  const newId = `review-local-${Date.now()}`;
  const newReview: Review = {
    ...review,
    id: newId,
    createdAt: Date.now(),
  };
  reviews.push(newReview);
  await AsyncStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
  return newId;
};
