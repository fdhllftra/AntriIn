import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const CHANNEL_ID = 'booking-reminders';

// Berapa menit sebelum jadwal pengingat dikirim (default 60).
export const REMINDER_MINUTES_BEFORE = parseInt(
  process.env.EXPO_PUBLIC_REMINDER_MINUTES_BEFORE || '60',
  10
);

export const notificationIdentifier = (bookingId: string): string =>
  `booking-${bookingId}`;

export const configureNotificationHandler = (): void => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
};

export const ensureNotificationPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Pengingat Booking',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
};

/**
 * Jadwalkan pengingat lokal X menit sebelum jam booking.
 * Mengembalikan true jika berhasil dijadwalkan, false jika tidak (izin
 * ditolak atau waktunya sudah lewat).
 */
export const scheduleBookingReminder = async (
  bookingId: string,
  date: string,
  timeSlot: string
): Promise<boolean> => {
  const reminderDate = new Date(`${date}T${timeSlot}:00`);
  reminderDate.setMinutes(reminderDate.getMinutes() - REMINDER_MINUTES_BEFORE);
  if (reminderDate.getTime() <= Date.now()) return false;

  const granted = await ensureNotificationPermissions();
  if (!granted) return false;

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: notificationIdentifier(bookingId),
      content: {
        title: 'Pengingat Booking AntriIn',
        body: `Jadwal Anda ${timeSlot} WIB. Segera datang agar tidak kehilangan slot.`,
        data: { bookingId },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
      },
    });
    return true;
  } catch (err) {
    console.error('scheduleBookingReminder failed:', err);
    return false;
  }
};

export const cancelBookingReminder = async (bookingId: string): Promise<void> => {
  try {
    await Notifications.cancelScheduledNotificationAsync(
      notificationIdentifier(bookingId)
    );
  } catch (err) {
    console.error('cancelBookingReminder failed:', err);
  }
};