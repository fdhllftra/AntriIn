import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import {
  getBookingsByCustomer,
  updateBookingStatus,
  getReviewByBooking,
} from '../../services/firestore';
import { cancelBookingReminder } from '../../services/notifications';
import { Booking } from '../../types';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { ReviewModal } from '../../components/ReviewModal';
import { Colors, Typography, Spacing, Layout, Radius } from '../../constants';
import { formatRupiah, parseDateString, formatDateLong } from '../../utils/format';

const statusBadgeMap: Record<Booking['status'], 'warning' | 'success' | 'error'> = {
  Menunggu: 'warning',
  Selesai: 'success',
  Batal: 'error',
};

export const HistoryScreen: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviewedBookingIds, setReviewedBookingIds] = useState<string[]>([]);
  const [activeReviewBooking, setActiveReviewBooking] = useState<Booking | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getBookingsByCustomer(user.uid);
      setBookings(data);

      const doneBookings = data.filter((b) => b.status === 'Selesai');
      const results = await Promise.all(
        doneBookings.map(async (b) => {
          const review = await getReviewByBooking(b.id);
          return review ? b.id : null;
        })
      );
      setReviewedBookingIds(
        results.filter((id): id is string => id !== null)
      );
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

  const handleCancel = (booking: Booking) => {
    Alert.alert(
      'Batalkan Booking',
      'Yakin ingin membatalkan booking ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Batalkan',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateBookingStatus(booking.id, 'Batal');
              cancelBookingReminder(booking.id);
              loadBookings();
            } catch (err) {
              Alert.alert('Gagal', 'Terjadi kesalahan. Silakan coba lagi.');
              console.error(err);
            }
          },
        },
      ]
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Memuat riwayat...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Riwayat Booking</Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Coba Lagi" onPress={loadBookings} size="sm" />
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadBookings();
              }}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="time-outline" size={48} color={Colors.textLight} />
              <Text style={styles.emptyTitle}>Belum ada booking</Text>
              <Text style={styles.emptyText}>
                Booking yang Anda buat akan muncul di sini.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const dateObj = parseDateString(item.date);
            return (
              <Card>
                <View style={styles.badgeRow}>
                  <Badge label={item.status} type={statusBadgeMap[item.status]} />
                  <Text style={styles.bookingId}>#{item.id.slice(-6).toUpperCase()}</Text>
                </View>
                <Text style={styles.barberName}>{item.barberName}</Text>
                <Text style={styles.dateText}>{formatDateLong(dateObj)}</Text>
                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
                  <Text style={styles.detailText}>{item.timeSlot} WIB</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="cut-outline" size={16} color={Colors.textSecondary} />
                  <Text style={styles.detailText} numberOfLines={1}>
                    {item.services.map((s) => s.name).join(', ')}
                  </Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Total</Text>
                  <Text style={styles.priceValue}>{formatRupiah(item.totalPrice)}</Text>
                </View>
                {item.status === 'Menunggu' ? (
                  <Button
                    title="Batalkan Booking"
                    variant="danger"
                    size="sm"
                    onPress={() => handleCancel(item)}
                  />
                ) : null}
                {item.status === 'Selesai' &&
                !reviewedBookingIds.includes(item.id) ? (
                  <Button
                    title="Beri Rating Kapster"
                    variant="secondary"
                    size="sm"
                    onPress={() => setActiveReviewBooking(item)}
                  />
                ) : null}
                {item.status === 'Selesai' &&
                reviewedBookingIds.includes(item.id) ? (
                  <Text style={styles.reviewedText}>
                    Terima kasih! Kapster telah Anda rating.
                  </Text>
                ) : null}
              </Card>
            );
          }}
        />
      )}

      {activeReviewBooking ? (
        <ReviewModal
          visible
          booking={activeReviewBooking}
          onClose={() => setActiveReviewBooking(null)}
          onSuccess={() => {
            setActiveReviewBooking(null);
            loadBookings();
            Alert.alert('Berhasil', 'Rating Anda telah terkirim.');
          }}
        />
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
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
  listContent: {
    padding: Layout.screenPadding,
    paddingBottom: Spacing.xl,
    flexGrow: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  bookingId: {
    ...Typography.caption,
    color: Colors.textLight,
  },
  barberName: {
    ...Typography.h4,
    color: Colors.text,
  },
  dateText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  detailText: {
    ...Typography.body,
    color: Colors.textSecondary,
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginBottom: Spacing.md,
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
  reviewedText: {
    ...Typography.caption,
    color: Colors.success,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  errorBox: {
    margin: Layout.screenPadding,
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
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginTop: Spacing.md,
  },
  emptyText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});