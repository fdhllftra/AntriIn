import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { Typography, Spacing, Layout, Radius } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';
import { getDateOptions, generateTimeSlots, TimeSlot } from '../../utils/dates';
import { formatDateShort, formatDateLong, formatRupiah, parseDateString } from '../../utils/format';
import { openWhatsApp } from '../../utils/whatsapp';

const DATE_OPTIONS = getDateOptions(7);

const statusBadgeMap: Record<Booking['status'], 'warning' | 'success' | 'error'> = {
  Menunggu: 'warning',
  Selesai: 'success',
  Batal: 'error',
};

export const DashboardScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
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
        setError('Gagal memuat data antrean admin.');
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
      `Yakin ingin ${label} antrean atas nama ${booking.customerName} (${booking.timeSlot} WIB)?`,
      [
        { text: 'Kembali', style: 'cancel' },
        {
          text: status === 'Selesai' ? 'Ya, Selesai' : 'Ya, Batalkan',
          style: status === 'Batal' ? 'destructive' : 'default',
          onPress: () => handleStatusChange(booking, status),
        },
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
        'Slot jam ini memiliki booking aktif. Selesaikan atau batalkan booking terlebih dahulu.'
      );
      return;
    }

    if (slot.blocked) {
      const blockedSlot = await getBlockedSlots(selectedDate);
      const target = blockedSlot.find((b) => b.timeSlot === slot.time);
      if (target) {
        Alert.alert(
          'Buka Slot Jam',
          `Buka kembali slot jam ${slot.time} agar dapat dipesan pelanggan?`,
          [
            { text: 'Batal', style: 'cancel' },
            {
              text: 'Buka Slot',
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
        'Tutup Slot Jam (Istirahat/Tutup)',
        `Tutup slot jam ${slot.time} agar tidak dapat dipilih oleh pelanggan?`,
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Tutup Slot',
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

  // Metrics Calculation
  const activeBookings = useMemo(
    () => bookings.filter((b) => b.status === 'Menunggu'),
    [bookings]
  );
  const finishedBookings = useMemo(
    () => bookings.filter((b) => b.status === 'Selesai'),
    [bookings]
  );
  const totalRevenue = useMemo(
    () => finishedBookings.reduce((sum, b) => sum + b.totalPrice, 0),
    [finishedBookings]
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Admin Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.screenTitle, { color: colors.text }]}>Dashboard Barbershop</Text>
          <Text style={[styles.screenSub, { color: colors.textSecondary }]}>Kelola antrean dan ketersediaan slot</Text>
        </View>
        <Badge label="Admin Mode" type="primary" />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.primary}
            colors={[colors.primary]}
            onRefresh={() => {
              setRefreshing(true);
              loadData(selectedDate);
            }}
          />
        }>
        {/* Date Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateList}>
          {DATE_OPTIONS.map((option, idx) => {
            const isSelected = option.value === selectedDate;
            const isToday = idx === 0;

            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => setSelectedDate(option.value)}
                style={[
                  styles.dateChip,
                  {
                    backgroundColor: isSelected
                      ? colors.primary
                      : isDark
                      ? colors.surfaceVariant
                      : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                activeOpacity={0.8}>
                <Text
                  style={[
                    styles.dateChipDay,
                    { color: isSelected ? colors.white : colors.textSecondary },
                  ]}>
                  {isToday ? 'Hari Ini' : option.label.split(',')[0]}
                </Text>
                <Text
                  style={[
                    styles.dateChipNum,
                    { color: isSelected ? colors.white : colors.text },
                  ]}>
                  {option.label.split(',')[1]?.trim() || option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Daily Metrics Row */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.metricIconWrap}>
              <Ionicons name="time" size={18} color="#D97706" />
            </View>
            <Text style={[styles.metricNumber, { color: colors.text }]}>{activeBookings.length}</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Menunggu</Text>
          </View>

          <View style={[styles.metricBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="checkmark-done" size={18} color="#059669" />
            </View>
            <Text style={[styles.metricNumber, { color: colors.text }]}>{finishedBookings.length}</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Selesai</Text>
          </View>

          <View style={[styles.metricBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.metricIconWrap, { backgroundColor: isDark ? colors.surfaceVariant : '#EFF6FF' }]}>
              <Ionicons name="cash-outline" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.metricNumber, { color: colors.primaryDark, fontSize: 13 }]}>
              {formatRupiah(totalRevenue)}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Omzet Selesai</Text>
          </View>
        </View>

        {/* ACTIVE BOOKINGS SECTION */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Antrean Menunggu</Text>
          <Badge label={`${activeBookings.length} pelanggan`} type="warning" />
        </View>

        {loading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Memuat antrean...</Text>
          </View>
        ) : activeBookings.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="checkmark-circle-outline" size={40} color={colors.success} />
            <Text style={[styles.emptyCardTitle, { color: colors.text }]}>Tidak Ada Antrean Menunggu</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Semua booking pada tanggal ini sudah dilayani atau belum ada yang memesan.
            </Text>
          </Card>
        ) : (
          activeBookings.map((booking) => (
            <Card key={booking.id} style={styles.adminBookingCard}>
              <View style={styles.bookingTopRow}>
                <View style={[styles.timePill, { backgroundColor: colors.primaryBackground }]}>
                  <Ionicons name="time" size={14} color={colors.primary} />
                  <Text style={[styles.timePillText, { color: colors.primaryDark }]}>{booking.timeSlot} WIB</Text>
                </View>
                <Badge label={booking.status} type="warning" />
              </View>

              <View style={styles.customerRow}>
                <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
                  <Text style={styles.avatarInitials}>
                    {booking.customerName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.customerNameText, { color: colors.text }]}>{booking.customerName}</Text>
                  <Text style={[styles.barberTagText, { color: colors.textSecondary }]}>
                    Kapster: <Text style={{ fontWeight: '700', color: colors.text }}>{booking.barberName}</Text>
                  </Text>
                  <Text style={[styles.servicesSubText, { color: colors.textSecondary }]}>
                    {booking.services.map((s) => s.name).join(' • ')}
                  </Text>
                </View>
              </View>

              <View style={[styles.priceRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Total Biaya</Text>
                <Text style={[styles.priceValue, { color: colors.primaryDark }]}>{formatRupiah(booking.totalPrice)}</Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.adminActionRow}>
                <Button
                  title="WhatsApp"
                  variant="outline"
                  size="sm"
                  icon={<Ionicons name="logo-whatsapp" size={15} color={colors.primary} />}
                  onPress={() =>
                    openWhatsApp(
                      `Halo Bapak/Kak ${booking.customerName}, kami dari Edi Barbershop ingin menginformasikan antrean pangkas jam ${booking.timeSlot} WIB Anda segera dimulai. Mohon dapat bersiap.`
                    )
                  }
                  style={{ flex: 1 }}
                />
                <Button
                  title="Selesaikan"
                  variant="secondary"
                  size="sm"
                  icon={<Ionicons name="checkmark" size={15} color={colors.white} />}
                  onPress={() => confirmStatusChange(booking, 'Selesai')}
                  style={{ flex: 1.2 }}
                />
                <Button
                  title="Batal"
                  variant="danger"
                  size="sm"
                  onPress={() => confirmStatusChange(booking, 'Batal')}
                  style={{ flex: 0.8 }}
                />
              </View>
            </Card>
          ))
        )}

        {/* FINISHED BOOKINGS SECTION */}
        {finishedBookings.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: Spacing.lg }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Riwayat Hari Ini (Selesai)</Text>
              <Badge label={`${finishedBookings.length} selesai`} type="success" />
            </View>

            {finishedBookings.map((booking) => (
              <Card key={booking.id} style={styles.historyMiniCard}>
                <View style={styles.historyRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.historyName, { color: colors.text }]}>
                      {booking.customerName} ({booking.timeSlot} WIB)
                    </Text>
                    <Text style={[styles.historyDetail, { color: colors.textSecondary }]}>
                      {booking.barberName} • {booking.services.map((s) => s.name).join(', ')}
                    </Text>
                  </View>
                  <Text style={[styles.historyPrice, { color: colors.success }]}>
                    {formatRupiah(booking.totalPrice)}
                  </Text>
                </View>
              </Card>
            ))}
          </>
        )}

        {/* SLOT MANAGER SECTION */}
        <View style={[styles.sectionHeader, { marginTop: Spacing.xl }]}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Kelola Slot Jam</Text>
            <Text style={[styles.screenSub, { color: colors.textSecondary }]}>
              Tap slot untuk menutup (istirahat/tutup) atau membuka kembali
            </Text>
          </View>
        </View>

        <View style={styles.slotGrid}>
          {slots.map((slot, index) => {
            const booked = isSlotBooked(selectedDate, slot.time);
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.slotChip,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                  slot.blocked && {
                    backgroundColor: isDark ? '#451A03' : '#FEF3C7',
                    borderColor: '#F59E0B',
                  },
                  booked && {
                    backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
                    borderColor: colors.border,
                    opacity: 0.7,
                  },
                ]}
                disabled={booked}
                onPress={() => handleToggleSlot(slot)}
                activeOpacity={0.75}>
                <Text style={[styles.slotTimeText, { color: colors.text }]}>{slot.time}</Text>
                <Text
                  style={[
                    styles.slotStatusText,
                    {
                      color: slot.blocked
                        ? '#B45309'
                        : booked
                        ? colors.textSecondary
                        : colors.success,
                    },
                  ]}>
                  {slot.blocked ? 'Ditutup' : booked ? 'Terisi' : 'Buka'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  screenSub: {
    fontSize: 12,
    marginTop: 2,
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
    fontSize: 13,
    marginTop: 8,
  },
  dateList: {
    gap: 8,
    paddingBottom: Spacing.md,
  },
  dateChip: {
    width: 82,
    paddingVertical: 10,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  dateChipDay: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  dateChipNum: {
    fontSize: 13,
    fontWeight: '800',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
  },
  metricBox: {
    flex: 1,
    padding: 12,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  metricIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  metricNumber: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyCardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
  },
  adminBookingCard: {
    padding: 14,
    marginBottom: 10,
  },
  bookingTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  timePillText: {
    fontSize: 13,
    fontWeight: '800',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  customerNameText: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  barberTagText: {
    fontSize: 12,
    marginBottom: 2,
  },
  servicesSubText: {
    fontSize: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 8,
    marginBottom: 10,
  },
  priceLabel: {
    fontSize: 13,
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  adminActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  historyMiniCard: {
    padding: 12,
    marginBottom: 8,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  historyDetail: {
    fontSize: 11,
  },
  historyPrice: {
    fontSize: 13,
    fontWeight: '700',
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: Spacing.xs,
  },
  slotChip: {
    width: '31%',
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotTimeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  slotStatusText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});