import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import QRCode from 'react-native-qrcode-svg';
import { BookingStackParamList } from '../../../navigation/types';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { Badge } from '../../../components/Badge';
import { Colors, Typography, Spacing, Layout, Radius } from '../../../constants';
import { formatRupiah, parseDateString, formatDateLong } from '../../../utils/format';
import { openWhatsApp } from '../../../utils/whatsapp';

type NavigationProp = NativeStackNavigationProp<BookingStackParamList, 'ETicket'>;
type RoutePropType = RouteProp<BookingStackParamList, 'ETicket'>;

export const ETicketScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { booking } = route.params;

  const dateObj = parseDateString(booking.date);
  const qrValue = JSON.stringify({
    id: booking.id,
    barber: booking.barberName,
    date: booking.date,
    time: booking.timeSlot,
  });

  const handleShare = async () => {
    try {
      await Share.share({
        message: `E-Ticket AntriIn\nID Booking: ${booking.id}\nKapster: ${booking.barberName}\nTanggal: ${formatDateLong(dateObj)}\nJam: ${booking.timeSlot} WIB\nStatus: ${booking.status}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.checkmarkCircle}>
          <Ionicons name="checkmark" size={44} color={Colors.white} />
        </View>
        <Text style={styles.title}>Booking Berhasil!</Text>
        <Text style={styles.subtitle}>
          Simpan atau tunjukkan E-Ticket ini kepada kasir saat datang.
        </Text>

        <View style={styles.ticketCard}>
          <View style={styles.ticketTop}>
            <View style={styles.ticketHeader}>
              <Text style={styles.ticketBrand}>AntriIn E-Ticket</Text>
              <Badge label={booking.status} type="warning" />
            </View>
            <View style={styles.qrBox}>
              <QRCode
                value={qrValue}
                size={180}
                color={Colors.text}
                backgroundColor={Colors.white}
              />
            </View>
            <Text style={styles.ticketId}>ID Booking: {booking.id}</Text>
          </View>

          <View style={styles.ticketDivider}>
            <View style={styles.notchLeft} />
            <View style={styles.dividerLine} />
            <View style={styles.notchRight} />
          </View>

          <View style={styles.ticketBody}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Kapster</Text>
              <Text style={styles.rowValue}>{booking.barberName}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Tanggal</Text>
              <Text style={styles.rowValue}>{formatDateLong(dateObj)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Jam</Text>
              <Text style={styles.rowValue}>{booking.timeSlot} WIB</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Nama</Text>
              <Text style={styles.rowValue}>{booking.customerName}</Text>
            </View>
          </View>

          <View style={styles.ticketFooter}>
            <Text style={styles.footerLabel}>Layanan</Text>
            {booking.services.map((s) => (
              <View key={s.id} style={styles.row}>
                <Text style={styles.rowLabel}>{s.name}</Text>
                <Text style={styles.rowValue}>{formatRupiah(s.price)}</Text>
              </View>
            ))}
            <View style={styles.rowTotal}>
              <Text style={styles.rowTotalLabel}>Total</Text>
              <Text style={styles.rowTotalValue}>{formatRupiah(booking.totalPrice)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title="Hubungi Admin via WhatsApp"
            variant="secondary"
            onPress={() =>
              openWhatsApp(
                `Halo AntriIn, saya ${booking.customerName}. Saya ingin konfirmasi/menanyakan booking: ${booking.id} (${booking.services
                  .map((s) => s.name)
                  .join(', ')}, ${formatDateLong(
                  dateObj
                )} ${booking.timeSlot} WIB).`
              )
            }
          />
          <Button
            title="Bagikan E-Ticket"
            variant="outline"
            onPress={handleShare}
          />
          <Button
            title="Selesai"
            size="lg"
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'ServiceSelection' }] })}
          />
        </View>
      </ScrollView>
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
    backgroundColor: Colors.success,
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
  ticketCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  ticketTop: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.lg,
  },
  ticketBrand: {
    ...Typography.h4,
    color: Colors.primaryDark,
  },
  qrBox: {
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
  },
  ticketId: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  ticketDivider: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notchLeft: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.background,
    marginLeft: -10,
  },
  notchRight: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.background,
    marginRight: -10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ticketBody: {
    padding: Spacing.lg,
  },
  ticketFooter: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  rowTotalLabel: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  rowTotalValue: {
    ...Typography.bodyMedium,
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  footerLabel: {
    ...Typography.captionMedium,
    color: Colors.textLight,
    marginBottom: Spacing.xs,
  },
  actions: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
});