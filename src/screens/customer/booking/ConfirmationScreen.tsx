import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../../contexts/AuthContext';
import { createBooking, getBookedSlots, getBlockedSlots } from '../../../services/firestore';
import { scheduleBookingReminder } from '../../../services/notifications';
import { Booking } from '../../../types';
import { BookingStackParamList } from '../../../navigation/types';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { BookingStepIndicator } from '../../../components/BookingStepIndicator';
import { Typography, Spacing, Layout, Radius } from '../../../constants';
import { useTheme } from '../../../contexts/ThemeContext';
import { formatRupiah, parseDateString, formatDateLong } from '../../../utils/format';

type NavigationProp = NativeStackNavigationProp<
  BookingStackParamList,
  'Confirmation'
>;
type RoutePropType = RouteProp<BookingStackParamList, 'Confirmation'>;

export const ConfirmationScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { services, barber, date, timeSlot } = route.params;
  const { user, profile } = useAuth();
  const { colors, isDark } = useTheme();

  const [submitting, setSubmitting] = useState(false);

  const totalPrice = services.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = services.reduce((sum, s) => sum + s.durationMinutes, 0);
  const dateObj = parseDateString(date);

  const handleConfirm = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const bookedSlots = await getBookedSlots(barber.id, date);
      if (bookedSlots.includes(timeSlot)) {
        Alert.alert(
          'Slot Baru Saja Terisi',
          'Slot jam yang Anda pilih baru saja dipesan pelanggan lain. Silakan pilih slot jam lain.'
        );
        setSubmitting(false);
        return;
      }

      const blockedList = await getBlockedSlots(date);
      if (blockedList.some((b) => b.timeSlot === timeSlot)) {
        Alert.alert(
          'Slot Ditutup',
          'Slot ini baru saja ditutup oleh admin. Silakan pilih slot lain.'
        );
        setSubmitting(false);
        return;
      }

      const bookingData: Omit<Booking, 'id' | 'createdAt'> = {
        customerId: user.uid,
        customerName: profile?.name || user.displayName || 'Pelanggan',
        customerPhone: profile?.phone,
        services,
        barberId: barber.id,
        barberName: barber.name,
        date,
        timeSlot,
        totalPrice,
        status: 'Menunggu',
      };

      const bookingId = await createBooking(bookingData, bookedSlots);
      const booking: Booking = {
        ...bookingData,
        id: bookingId,
        createdAt: Date.now(),
      };

      // Pengingat lokal X menit sebelum jadwal
      await scheduleBookingReminder(
        bookingId,
        date,
        timeSlot
      );

      navigation.reset({
        index: 1,
        routes: [
          { name: 'ServiceSelection' },
          { name: 'ETicket', params: { booking } },
        ],
      });
    } catch (err) {
      console.error(err);
      Alert.alert(
        'Booking Gagal',
        'Terjadi kendala jaringan saat memproses pesanan. Silakan coba kembali.'
      );
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Stepper UX */}
      <BookingStepIndicator currentStep={4} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        
        {/* Header Icon & Title */}
        <View style={styles.headerHero}>
          <View style={[styles.iconCircle, { backgroundColor: isDark ? colors.surfaceVariant : '#EFF6FF' }]}>
            <Ionicons name="shield-checkmark" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Konfirmasi Pesanan</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Satu langkah lagi untuk mendapatkan E-Ticket antrean Anda
          </Text>
        </View>

        {/* Schedule Highlights Card */}
        <Card style={styles.scheduleCard}>
          <View style={styles.scheduleRow}>
            <View style={[styles.calendarIconBox, { backgroundColor: colors.primary }]}>
              <Ionicons name="calendar" size={20} color={colors.white} />
            </View>
            <View style={styles.scheduleTextWrap}>
              <Text style={[styles.scheduleDate, { color: colors.text }]}>{formatDateLong(dateObj)}</Text>
              <Text style={[styles.scheduleTime, { color: colors.primaryDark }]}>Pukul {timeSlot} WIB</Text>
            </View>
          </View>

          <View style={[styles.barberRow, { borderTopColor: colors.border }]}>
            <Ionicons name="cut" size={18} color={colors.textSecondary} />
            <Text style={[styles.barberLabel, { color: colors.textSecondary }]}>Kapster Pilihan:</Text>
            <Text style={[styles.barberName, { color: colors.text }]}>{barber.name}</Text>
          </View>
        </Card>

        {/* Service Breakdown */}
        <Card style={styles.serviceBreakdownCard}>
          <Text style={[styles.cardHeaderTitle, { color: colors.textSecondary }]}>RINCIAN LAYANAN</Text>
          {services.map((s) => (
            <View key={s.id} style={styles.serviceItemRow}>
              <View style={styles.serviceItemLeft}>
                <Text style={[styles.serviceItemName, { color: colors.text }]}>{s.name}</Text>
                <Text style={[styles.serviceItemDuration, { color: colors.textLight }]}>~{s.durationMinutes} menit</Text>
              </View>
              <Text style={[styles.serviceItemPrice, { color: colors.text }]}>{formatRupiah(s.price)}</Text>
            </View>
          ))}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.totalRow}>
            <View>
              <Text style={[styles.totalLabel, { color: colors.text }]}>Total Biaya</Text>
              <Text style={[styles.durationSummary, { color: colors.textLight }]}>Total durasi: ~{totalDuration} menit</Text>
            </View>
            <Text style={[styles.totalAmount, { color: colors.primaryDark }]}>{formatRupiah(totalPrice)}</Text>
          </View>
        </Card>

        {/* Payment Notice */}
        <View style={[styles.noticeBox, { backgroundColor: isDark ? colors.surfaceVariant : '#EFF6FF', borderColor: colors.border }]}>
          <Ionicons name="cash-outline" size={20} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.noticeTitle, { color: colors.text }]}>Pembayaran di Kasir</Text>
            <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
              Tidak perlu transfer sekarang. Pembayaran dapat dilakukan tunai atau QRIS setelah selesai potong rambut.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action */}
      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
        <Button
          title={submitting ? 'Memproses E-Ticket...' : 'Konfirmasi & Dapatkan Tiket'}
          size="lg"
          loading={submitting}
          icon={!submitting ? <Ionicons name="ticket-outline" size={18} color={colors.white} /> : undefined}
          onPress={handleConfirm}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    padding: Layout.screenPadding,
    paddingBottom: Spacing.xl,
  },
  headerHero: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  scheduleCard: {
    padding: 14,
    marginBottom: 12,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  calendarIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleTextWrap: {
    flex: 1,
  },
  scheduleDate: {
    fontSize: 15,
    fontWeight: '700',
  },
  scheduleTime: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  barberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    paddingTop: 10,
  },
  barberLabel: {
    fontSize: 13,
  },
  barberName: {
    fontSize: 14,
    fontWeight: '700',
  },
  serviceBreakdownCard: {
    padding: 14,
    marginBottom: 12,
  },
  cardHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  serviceItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceItemLeft: {
    flex: 1,
  },
  serviceItemName: {
    fontSize: 14,
    fontWeight: '600',
  },
  serviceItemDuration: {
    fontSize: 11,
    marginTop: 2,
  },
  serviceItemPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  durationSummary: {
    fontSize: 11,
    marginTop: 2,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '800',
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  noticeText: {
    fontSize: 12,
    lineHeight: 16,
  },
  footer: {
    padding: Layout.screenPadding,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
  },
});