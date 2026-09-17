import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getBookingsByDate,
  updateBookingStatus,
  getBlockedSlots,
  blockSlot,
  unblockSlot,
} from '../../services/firestore';
import { cancelBookingReminder } from '../../services/notifications';
import { Booking, BookingStatus } from '../../types';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Colors, Typography, Spacing, Layout, Radius } from '../../constants';
import { getDateOptions, generateTimeSlots, TimeSlot } from '../../utils/dates';
import { formatDateShort, formatRupiah } from '../../utils/format';

const STATUS_OPTIONS: { label: string; value: BookingStatus; type: 'warning' | 'success' | 'error' }[] = [
  { label: 'Menunggu', value: 'Menunggu', type: 'warning' },
  { label: 'Selesai', value: 'Selesai', type: 'success' },
  { label: 'Batal', value: 'Batal', type: 'error' },
];

const DATE_OPTIONS = getDateOptions(7);

export const DashboardScreen: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(DATE_OPTIONS[0].value);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(
    async (date: string) => {
      setLoading(true);
      setError(null);
      try {
        const [bookingData, blockedData] = await Promise.all([
          getBookingsByDate(date),
          getBlockedSlots(date),
        ]);
        setBookings(
          bookingData.sort((a, b) => a.timeSlot.localeCompare(b.timeSlot))
        );
        const blockedTimes = blockedData.map((b) => b.timeSlot);
        setSlots(generateTimeSlots([], blockedTimes));
      } catch (err) {
        setError('Gagal memuat data dashboard.');
        console.error(err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate, loadData]);

  const handleStatusChange = async (booking: Booking, status: BookingStatus) => {
    try {
      await updateBookingStatus(booking.id, status);
      if (status === 'Batal') {
        cancelBookingReminder(booking.id);
      }
      loadData(selectedDate);
    } catch (err) {
      Alert.alert('Gagal', 'Terjadi kesalahan. Silakan coba lagi.');
      console.error(err);
    }
  };

  const confirmStatusChange = (booking: Booking, status: 'Selesai' | 'Batal') => {
    const label = status === 'Selesai' ? 'selesaikan' : 'batalkan';
    Alert.alert(
      `${status === 'Selesai' ? 'Selesaikan' : 'Batalkan'} Booking`,
      `Yakin ingin ${label} booking ${booking.customerName} (${booking.timeSlot} WIB)?`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Ya', style: status === 'Batal' ? 'destructive' : 'default', onPress: () => handleStatusChange(booking, status) },
      ]
    );
  };

  const isSlotBooked = (date: string, time: string): boolean =>
    bookings.some(
      (b) => b.date === date && b.timeSlot === time && b.status !== 'Batal'
    );

  const handleToggleSlot = async (slot: TimeSlot) => {
    if (isSlotBooked(selectedDate, slot.time)) {
      Alert.alert(
        'Slot Terisi',
        'Slot ini memiliki booking aktif. Batalkan atau selesaikan booking terlebih dahulu.'
      );
      return;
    }

    if (slot.blocked) {
      const blockedSlot = await getBlockedSlots(selectedDate);
      const target = blockedSlot.find((b) => b.timeSlot === slot.time);
      if (target) {
        Alert.alert(
          'Buka Slot',
          `Yakin ingin membuka kembali slot ${slot.time}?`,
          [
            { text: 'Batal', style: 'cancel' },
            {
              text: 'Buka',
              onPress: async () => {
                try {
                  await unblockSlot(target.id);
                  loadData(selectedDate);
                } catch (err) {
                  console.error(err);
                }
              },
            },
          ]
        );
      }
    } else {
      Alert.alert(
        'Tutup Slot',
        `Tutup slot ${slot.time} agar pelanggan tidak dapat booking?`,
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Tutup',
            onPress: async () => {
              try {
                await blockSlot(selectedDate, slot.time);
                loadData(selectedDate);
              } catch (err) {
                console.error(err);
              }
            },
          },
        ]
      );
    }
  };

  const renderBookings = () => {
    const active = bookings.filter((b) => b.status === 'Menunggu');
    const finished = bookings.filter((b) => b.status !== 'Menunggu');

    return (
      <>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Antrean Hari Ini</Text>
          <Badge label={`${active.length} menunggu`} type="warning" />
        </View>
        {bookings.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>Belum ada booking pada tanggal ini.</Text>
          </Card>
        ) : null}

        {active.map((booking) => (
          <BookingCard
            key={booking.id}
            booking={booking}
            onSelesai={() => confirmStatusChange(booking, 'Selesai')}
            onBatal={() => confirmStatusChange(booking, 'Batal')}
          />
        ))}

        {finished.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Riwayat Tanggal Ini</Text>
            </View>
            {finished.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </>
        ) : null}
      </>
    );
  };

  const renderSlotManager = () => (
    <View style={styles.slotSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Kelola Slot</Text>
        <Text style={styles.slotHint}>Tap untuk tutup/buka slot</Text>
      </View>
      <View style={styles.slotGrid}>
        {slots.map((slot, index) => {
          const booked = isSlotBooked(selectedDate, slot.time);
          const style = [
            styles.slot,
            slot.blocked && styles.slotBlocked,
            booked && styles.slotBooked,
          ];
          return (
            <TouchableOpacity
              key={index}
              style={style}
              disabled={booked}
              onPress={() => handleToggleSlot(slot)}>
              <Text style={styles.slotTime}>{slot.time}</Text>
              <Text style={styles.slotStatus}>
                {slot.blocked ? 'Ditutup' : booked ? 'Terisi' : 'Buka'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Dashboard Admin</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData(selectedDate);
            }}
          />
        }>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateList}>
          {DATE_OPTIONS.map((option) => {
            const selected = option.value === selectedDate;
            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => setSelectedDate(option.value)}
                style={[styles.dateChip, selected && styles.dateChipSelected]}>
                <Text
                  style={[
                    styles.dateChipLabel,
                    selected && styles.dateChipLabelSelected,
                  ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Button title="Coba Lagi" onPress={() => loadData(selectedDate)} size="sm" />
          </View>
        ) : loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Memuat dashboard...</Text>
          </View>
        ) : (
          <>
            {renderBookings()}
            {renderSlotManager()}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

interface BookingCardProps {
  booking: Booking;
  onSelesai?: () => void;
  onBatal?: () => void;
}

const statusBadgeMap: Record<Booking['status'], 'warning' | 'success' | 'error'> = {
  Menunggu: 'warning',
  Selesai: 'success',
  Batal: 'error',
};

const BookingCard: React.FC<BookingCardProps> = ({ booking, onSelesai, onBatal }) => (
  <Card>
    <View style={styles.badgeRow}>
      <Badge label={booking.status} type={statusBadgeMap[booking.status]} />
      <Text style={styles.bookingTime}>{booking.timeSlot} WIB</Text>
    </View>
    <View style={styles.customerRow}>
      <View style={styles.customerAvatar}>
        <Ionicons name="person" size={18} color={Colors.white} />
      </View>
      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>{booking.customerName}</Text>
        <Text style={styles.customerDetail}>
          {booking.barberName} - {booking.services.map((s) => s.name).join(', ')}
        </Text>
      </View>
    </View>
    <View style={styles.priceRow}>
      <Text style={styles.priceLabel}>Total</Text>
      <Text style={styles.priceValue}>{formatRupiah(booking.totalPrice)}</Text>
    </View>
    {booking.status === 'Menunggu' && onSelesai && onBatal ? (
      <View style={styles.actionRow}>
        <View style={styles.actionGrow}>
          <Button
            title="Selesai"
            variant="secondary"
            size="sm"
            onPress={onSelesai}
          />
        </View>
        <View style={styles.actionGrow}>
          <Button title="Batal" variant="danger" size="sm" onPress={onBatal} />
        </View>
      </View>
    ) : null}
  </Card>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  screenTitle: {
    ...Typography.h2,
    color: Colors.text,
  },
  content: {
    padding: Layout.screenPadding,
    paddingBottom: Spacing.xl,
  },
  center: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  dateList: {
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  dateChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dateChipLabel: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
  },
  dateChipLabelSelected: {
    color: Colors.white,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  bookingTime: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  customerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  customerDetail: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  priceLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  priceValue: {
    ...Typography.bodyMedium,
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionGrow: {
    flex: 1,
  },
  slotSection: {
    marginTop: Spacing.lg,
  },
  slotHint: {
    ...Typography.caption,
    color: Colors.textLight,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  slot: {
    width: '31%',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  slotBlocked: {
    backgroundColor: Colors.warningLight,
    borderColor: '#FCD34D',
  },
  slotBooked: {
    backgroundColor: Colors.errorLight,
    borderColor: '#FCA5A5',
    opacity: 0.8,
  },
  slotTime: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  slotStatus: {
    ...Typography.small,
    color: Colors.textLight,
    marginTop: 2,
  },
  errorBox: {
    marginTop: Spacing.md,
    backgroundColor: Colors.errorLight,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  errorText: {
    ...Typography.body,
    color: Colors.text,
  },
});