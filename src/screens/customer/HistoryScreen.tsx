import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getBookingsByCustomer, updateBookingStatus } from '../../services/firestore';
import {
  subscribeToBookingsByCustomer,
  subscribeToReviews,
} from '../../services/realtime';
import { cancelBookingReminder } from '../../services/notifications';
import { Booking, BookingStatus, Review } from '../../types';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { ReviewModal } from '../../components/ReviewModal';
import { ETicketModal } from '../../components/ETicketModal';
import { HistoryScreenSkeleton } from '../../components/Skeleton';
import { Toast, ToastType } from '../../components/Toast';
import { Typography, Spacing, Layout, Radius } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';
import { formatRupiah, parseDateString, formatDateLong } from '../../utils/format';

type FilterTab = 'Semua' | BookingStatus;

const FILTERS: { label: string; value: FilterTab }[] = [
  { label: 'Semua', value: 'Semua' },
  { label: 'Aktif', value: 'Menunggu' },
  { label: 'Selesai', value: 'Selesai' },
  { label: 'Batal', value: 'Batal' },
];

const statusBadgeMap: Record<Booking['status'], 'warning' | 'success' | 'error'> = {
  Menunggu: 'warning',
  Selesai: 'success',
  Batal: 'error',
};

export const HistoryScreen: React.FC = () => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('Semua');
  const [selectedTicket, setSelectedTicket] = useState<Booking | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeReviewBooking, setActiveReviewBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType }>({
    visible: false,
    message: '',
    type: 'success',
  });

  const loadBookings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      await getBookingsByCustomer(user.uid);
    } catch (err) {
      setError('Gagal memuat riwayat booking.');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  useEffect(() => subscribeToBookingsByCustomer(user?.uid, setBookings), [user?.uid]);
  useEffect(() => subscribeToReviews(setReviews), []);

  const reviewedBookingIds = useMemo(
    () => reviews.map((r) => r.bookingId),
    [reviews]
  );

  const handleCancel = (booking: Booking) => {
    Alert.alert(
      'Batalkan Booking',
      'Yakin ingin membatalkan jadwal booking ini? Slot waktu akan dikembalikan.',
      [
        { text: 'Tidak', style: 'cancel' },
        {
          text: 'Ya, Batalkan',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateBookingStatus(booking.id, 'Batal');
              cancelBookingReminder(booking.id);
              setToast({
                visible: true,
                message: 'Jadwal booking berhasil dibatalkan. Slot waktu telah dikembalikan.',
                type: 'info',
              });
              loadBookings();
            } catch (err) {
              setToast({
                visible: true,
                message: 'Terjadi kesalahan saat membatalkan jadwal.',
                type: 'error',
              });
              console.error(err);
            }
          },
        },
      ]
    );
  };

  const filteredBookings = useMemo(() => {
    if (activeFilter === 'Semua') return bookings;
    return bookings.filter((b) => b.status === activeFilter);
  }, [bookings, activeFilter]);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <HistoryScreenSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Screen Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.screenTitle, { color: colors.text }]}>Riwayat Antrean & Booking</Text>
        <Text style={[styles.screenSub, { color: colors.textSecondary }]}>Pantau jadwal dan bukti tiket Anda</Text>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {FILTERS.map((tab) => {
            const isSelected = activeFilter === tab.value;
            return (
              <TouchableOpacity
                key={tab.value}
                onPress={() => setActiveFilter(tab.value)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected
                      ? colors.primary
                      : isDark
                      ? colors.surfaceVariant
                      : '#F1F5F9',
                  },
                ]}
                activeOpacity={0.8}>
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: isSelected ? colors.white : colors.textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {error ? (
        <View style={[styles.errorBox, { backgroundColor: colors.errorLight }]}>
          <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
          <Button title="Coba Lagi" onPress={loadBookings} size="sm" />
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={colors.primary}
              colors={[colors.primary]}
              onRefresh={() => {
                setRefreshing(true);
                loadBookings();
              }}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? colors.surfaceVariant : '#F1F5F9' }]}>
                <Ionicons name="calendar-outline" size={40} color={colors.textLight} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {activeFilter === 'Semua' ? 'Belum Ada Booking' : `Tidak Ada Booking ${activeFilter}`}
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {activeFilter === 'Semua'
                  ? 'Pemesanan jadwal yang Anda buat akan tersimpan di sini.'
                  : `Riwayat dengan status ${activeFilter} masih kosong.`}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const dateObj = parseDateString(item.date);
            const isPending = item.status === 'Menunggu';
            const isDone = item.status === 'Selesai';
            const hasReview = reviewedBookingIds.includes(item.id);

            return (
              <Card style={styles.bookingCard} hoverable onPress={() => setSelectedTicket(item)}>
                {/* Header: Status & Code */}
                <View style={styles.cardHeader}>
                  <Badge label={item.status} type={statusBadgeMap[item.status]} pulse={isPending} />
                  <Text style={[styles.bookingIdText, { color: colors.textLight }]}>
                    #{item.id.slice(-6).toUpperCase()}
                  </Text>
                </View>

                {/* Barber & Schedule */}
                <View style={styles.cardMain}>
                  <View style={[styles.barberAvatarMini, { backgroundColor: isDark ? colors.surfaceVariant : '#EFF6FF' }]}>
                    <Ionicons name="cut" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.barberName, { color: colors.text }]}>{item.barberName}</Text>
                    <View style={styles.metaRow}>
                      <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
                      <Text style={[styles.metaText, { color: colors.textSecondary }]}>{formatDateLong(dateObj)}</Text>
                      <Text style={[styles.dotSep, { color: colors.textLight }]}>•</Text>
                      <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
                      <Text style={[styles.metaTextHighlight, { color: colors.primaryDark }]}>{item.timeSlot} WIB</Text>
                    </View>
                  </View>
                </View>

                {/* Services Pills */}
                <View style={[styles.serviceRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.serviceListText, { color: colors.textSecondary }]} numberOfLines={1}>
                    {item.services.map((s) => s.name).join(' • ')}
                  </Text>
                  <Text style={[styles.priceText, { color: colors.text }]}>{formatRupiah(item.totalPrice)}</Text>
                </View>

                {/* Action Row */}
                <View style={[styles.actionRow, { borderTopColor: colors.border }]}>
                  {isPending && (
                    <>
                      <Button
                        title="Lihat E-Ticket"
                        size="sm"
                        icon={<Ionicons name="qr-code-outline" size={15} color={colors.white} />}
                        onPress={() => setSelectedTicket(item)}
                        style={{ flex: 1.2 }}
                      />
                      <Button
                        title="Batalkan"
                        variant="ghost"
                        size="sm"
                        onPress={() => handleCancel(item)}
                        textStyle={{ color: colors.error }}
                        style={{ flex: 0.8 }}
                      />
                    </>
                  )}

                  {isDone && !hasReview && (
                    <Button
                      title="Beri Nilai & Ulasan"
                      variant="outline"
                      size="sm"
                      icon={<Ionicons name="star-outline" size={15} color={colors.primary} />}
                      onPress={() => setActiveReviewBooking(item)}
                      style={{ flex: 1 }}
                    />
                  )}

                  {isDone && hasReview && (
                    <View style={styles.reviewedNotice}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                      <Text style={[styles.reviewedNoticeText, { color: colors.success }]}>
                        Ulasan Anda telah tersimpan
                      </Text>
                    </View>
                  )}

                  {item.status === 'Batal' && (
                    <Text style={[styles.cancelledNotice, { color: colors.textLight }]}>
                      Pemesanan ini telah dibatalkan
                    </Text>
                  )}
                </View>
              </Card>
            );
          }}
        />
      )}

      {/* Review Modal */}
      {activeReviewBooking && (
        <ReviewModal
          visible
          booking={activeReviewBooking}
          onClose={() => setActiveReviewBooking(null)}
          onSuccess={() => {
            setActiveReviewBooking(null);
            loadBookings();
            setToast({
              visible: true,
              message: 'Terima kasih! Ulasan Anda berhasil dikirim.',
              type: 'success',
            });
          }}
        />
      )}

      {/* Global E-Ticket Viewer */}
      <ETicketModal
        visible={!!selectedTicket}
        booking={selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />

      {/* Toast Feedback */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...Typography.body,
    marginTop: Spacing.md,
  },
  header: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
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
    marginBottom: Spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
  },
  filterChipText: {
    fontSize: 12,
  },
  listContent: {
    padding: Layout.screenPadding,
    paddingBottom: Spacing.xl,
  },
  bookingCard: {
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  bookingIdText: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  barberAvatarMini: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  barberName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  metaTextHighlight: {
    fontSize: 12,
    fontWeight: '700',
  },
  dotSep: {
    fontSize: 12,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 8,
    marginBottom: 8,
  },
  serviceListText: {
    fontSize: 12,
    flex: 1,
    marginRight: 8,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    paddingTop: 10,
  },
  reviewedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  reviewedNoticeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cancelledNotice: {
    fontSize: 12,
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  errorBox: {
    margin: Layout.screenPadding,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
    gap: 10,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
  },
});