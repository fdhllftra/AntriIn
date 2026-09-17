// NOTIFIKASI DI-NONAKTIFKAN SEMENTARA.
// `expo-notifications` tidak didukung di Expo Go (SDK terbaru), sehingga
// pengingat terjadwal dikembalikan sebagai 'unsupported' tanpa meng-import
// modul native apa pun. Aktifkan kembali saat build native development
// build (hapus komentar lazy import 'expo-notifications' di bawah).

export const REMINDER_MINUTES_BEFORE = parseInt(
  process.env.EXPO_PUBLIC_REMINDER_MINUTES_BEFORE || '60',
  10
);

export type ReminderStatus = 'scheduled' | 'denied' | 'past' | 'unsupported';

export const configureNotificationHandler = async (): Promise<void> => {
  // no-op saat nonaktif
};

export const scheduleBookingReminder = async (
  _bookingId: string,
  _date: string,
  _timeSlot: string
): Promise<ReminderStatus> => {
  return 'unsupported';
};

export const cancelBookingReminder = async (
  _bookingId: string
): Promise<void> => {
  // no-op saat nonaktif
};