export type UserRole = 'customer' | 'admin';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  photoURL?: string;
  role: UserRole;
  createdAt?: number;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  isActive: boolean;
  createdAt?: number;
}

export interface Barber {
  id: string;
  name: string;
  photoURL?: string;
  specialty?: string;
  isActive: boolean;
  createdAt?: number;
}

export type BookingStatus = 'Menunggu' | 'Selesai' | 'Batal';

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  services: Service[];
  barberId: string;
  barberName: string;
  date: string;
  timeSlot: string;
  totalPrice: number;
  status: BookingStatus;
  createdAt: number;
  updatedAt?: number;
}

export interface BlockedSlot {
  id: string;
  date: string;
  timeSlot: string;
  reason?: string;
  createdAt: number;
}

export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  barberId: string;
  rating: number;
  comment?: string;
  createdAt: number;
}