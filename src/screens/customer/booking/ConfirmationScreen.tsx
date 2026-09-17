import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
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
import { Colors, Typography, Spacing, Layout, Radius } from '../../../constants';
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
          'Slot Sudah Terisi',
          'Slot yang Anda pilih baru saja dipesan pelanggan lain. Silakan pilih slot lain.'
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

      // Pengingat lokal X menit sebelum jadwal (opsional, tergantung izin notifikasi).
      const reminderStatus = await scheduleBookingReminder(
        bookingId,
        date,
        timeSlot
      );
      if (reminderStatus === 'denied') {
        Alert.alert(
          'Pengingat',
          'Booking berhasil. Aktifkan izin notifikasi untuk mendapatkan pengingat jadwal.'
        );
      }

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
        'Terjadi kesalahan saat membuat booking. Silakan coba lagi.'
      );
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.checkmarkCircle}>
          <Ionicons name="clipboard-outline" size={40} color={Colors.white} />
        </View>
        <Text style={styles.title}>Periksa Detail Booking</Text>
        <Text style={styles.subtitle}>
          Pastikan detail di bawah sudah benar sebelum mengonfirmasi.
        </Text>

        <Card>
          <Text style={styles.cardTitle}>Layanan</Text>
          {services.map((s) => (
            <View key={s.id} style={styles.row}>
              <Text style={styles.rowLabel}>{s.name}</Text>
              <Text style={styles.rowValue}>{formatRupiah(s.price)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowTotal}>Total</Text>
            <Text style={styles.rowTotalValue}>{formatRupiah(totalPrice)}</Text>
          </View>
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Detail Jadwal</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Kapster</Text>
            <Text style={styles.rowValue}>{barber.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Tanggal</Text>
            <Text style={styles.rowValue}>{formatDateLong(dateObj)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Jam</Text>
            <Text style={styles.rowValue}>{timeSlot} WIB</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Durasi</Text>
            <Text style={styles.rowValue}>{totalDuration} menit</Text>
          </View>
        </Card>

        <View style={styles.notice}>
          <Ionicons name="information-circle" size={18} color={Colors.primary} />
          <Text style={styles.noticeText}>
            Pembayaran dilakukan langsung di barbershop setelah layanan selesai.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Konfirmasi Booking"
          size="lg"
          loading={submitting}
          onPress={handleConfirm}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Layout.screenPadding,
    paddingBottom: Spacing.xl,
  },
  checkmarkCircle: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  title: {
    ...Typography.h3,
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    marginTop: Spacing.xs,
  },
  cardTitle: {
    ...Typography.bodyMedium,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
    gap: Spacing.md,
  },
  rowLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  rowValue: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  rowTotal: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  rowTotalValue: {
    ...Typography.bodyMedium,
    color: Colors.primaryDark,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  noticeText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
  },
  footer: {
    padding: Layout.screenPadding,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
});