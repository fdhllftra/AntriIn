import { toDateString } from './format';

export interface TimeSlot {
  time: string;
  available: boolean;
  blocked: boolean;
  reason?: string;
}

export const getOpeningHour = (): number => {
  const val = Number(process.env.EXPO_PUBLIC_SHOP_OPEN_HOUR);
  return Number.isFinite(val) ? val : 10;
};

export const getClosingHour = (): number => {
  const val = Number(process.env.EXPO_PUBLIC_SHOP_CLOSE_HOUR);
  return Number.isFinite(val) ? val : 21;
};

export const getSlotIntervalMinutes = (): number => {
  const val = Number(process.env.EXPO_PUBLIC_BOOKING_INTERVAL_MINUTES);
  return Number.isFinite(val) && val > 0 ? val : 30;
};

export const generateTimeSlots = (
  bookedSlots: string[] = [],
  blockedSlots: string[] = []
): TimeSlot[] => {
  const openHour = getOpeningHour();
  const closeHour = getClosingHour();
  const interval = getSlotIntervalMinutes();

  const slots: TimeSlot[] = [];
  const now = new Date();

  for (let hour = openHour; hour < closeHour; hour++) {
    for (let minute = 0; minute < 60; minute += interval) {
      const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      const isBooked = bookedSlots.includes(time);
      const isBlocked = blockedSlots.includes(time);
      slots.push({
        time,
        available: !isBooked && !isBlocked,
        blocked: isBlocked,
        reason: isBlocked ? 'Slot ditutup' : undefined,
      });
    }
  }

  return slots;
};

export const getNextNDates = (n: number): Date[] => {
  const dates: Date[] = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  return dates;
};

export const getDateOptions = (n = 7): { label: string; value: string; date: Date }[] => {
  return getNextNDates(n).map((date) => ({
    label: date.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }),
    value: toDateString(date),
    date,
  }));
};

export { toDateString };