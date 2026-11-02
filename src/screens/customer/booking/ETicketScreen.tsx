import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Share,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import QRCode from 'react-native-qrcode-svg';
import { BookingStackParamList } from '../../../navigation/types';
import { Button } from '../../../components/Button';
import { Badge } from '../../../components/Badge';
import { useTheme } from '../../../contexts/ThemeContext';
import { Typography, Spacing, Layout, Radius } from '../../../constants';
import { formatRupiah, parseDateString, formatDateLong } from '../../../utils/format';
import { openWhatsApp } from '../../../utils/whatsapp';

type NavigationProp = NativeStackNavigationProp<BookingStackParamList, 'ETicket'>;
type RoutePropType = RouteProp<BookingStackParamList, 'ETicket'>;

export const ETicketScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { colors, isDark } = useTheme();
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

  const goToHome = () => {
    // Navigate to root tab "Home"
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate('Home' as never);
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'ServiceSelection' }] });
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Success Icon */}
        <View style={[styles.checkmarkCircle, { backgroundColor: colors.success }]}>
          <Ionicons name="checkmark" size={38} color={colors.white} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Booking Berhasil!</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          E-Ticket Anda telah diterbitkan. Tunjukkan kepada kasir saat tiba di barbershop.
        </Text>

        {/* Ticket Container */}
        <View
          style={[
            styles.ticketCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}>
          <View style={styles.ticketTop}>
            <View style={styles.ticketHeader}>
              <View style={styles.brandContainer}>
                <Image
                  source={require('../../../assets/images/app-logo.png')}
                  style={styles.ticketLogo}
                  resizeMode="contain"
                />
                <View>
                  <Text style={[styles.ticketBrand, { color: colors.text }]}>AntriIn</Text>
                  <Text style={[styles.ticketShop, { color: colors.textSecondary }]}>Edi Barbershop</Text>
                </View>
              </View>
              <Badge label={booking.status} type="warning" />
            </View>

            <View style={styles.qrBox}>
              <View style={styles.qrInner}>
                <QRCode
                  value={qrValue}
                  size={160}
                  color="#0F172A"
                  backgroundColor="#FFFFFF"
                />
              </View>
              <Text style={[styles.qrScanHint, { color: colors.textSecondary }]}>
                Pindai di kasir untuk verifikasi antrean
              </Text>
              <Text style={[styles.ticketId, { color: colors.textLight }]}>
                ID: {booking.id}
              </Text>
            </View>
          </View>

          {/* Notch Divider */}
          <View style={styles.ticketDivider}>
            <View style={[styles.notch, styles.notchLeft, { backgroundColor: colors.background }]} />
            <View style={[styles.dividerDashed, { borderColor: colors.border }]} />
            <View style={[styles.notch, styles.notchRight, { backgroundColor: colors.background }]} />
          </View>

          {/* Ticket Body */}
          <View style={styles.ticketBody}>
            <View style={styles.infoRow}>
              <View style={styles.infoCol}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>KAPSTER</Text>
                <Text style={[styles.infoVal, { color: colors.text }]}>{booking.barberName}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>WAKTU</Text>
                <Text style={[styles.infoValHighlight, { color: colors.primaryDark }]}>{booking.timeSlot} WIB</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoCol}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>TANGGAL</Text>
                <Text style={[styles.infoVal, { color: colors.text }]}>{formatDateLong(dateObj)}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>NAMA PELANGGAN</Text>
                <Text style={[styles.infoVal, { color: colors.text }]}>{booking.customerName}</Text>
              </View>
            </View>

            <View style={[styles.servicesBreakdown, { borderTopColor: colors.border }]}>
              <Text style={[styles.servicesLabel, { color: colors.textSecondary }]}>LAYANAN</Text>
              {booking.services.map((s) => (
                <View key={s.id} style={styles.serviceItem}>
                  <Text style={[styles.serviceName, { color: colors.text }]}>{s.name}</Text>
                  <Text style={[styles.servicePrice, { color: colors.textSecondary }]}>{formatRupiah(s.price)}</Text>
                </View>
              ))}
              <View style={[styles.totalLine, { borderTopColor: colors.border }]}>
                <Text style={[styles.totalLabel, { color: colors.text }]}>Total Biaya</Text>
                <Text style={[styles.totalValue, { color: colors.primaryDark }]}>{formatRupiah(booking.totalPrice)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title="Bagikan E-Ticket"
            variant="outline"
            icon={<Ionicons name="share-social-outline" size={18} color={colors.primary} />}
            onPress={handleShare}
          />
          <Button
            title="Hubungi Barbershop (WhatsApp)"
            variant="secondary"
            icon={<Ionicons name="logo-whatsapp" size={18} color={colors.white} />}
            onPress={() =>
              openWhatsApp(
                `Halo Edi Barbershop, saya telah booking tiket #${booking.id} (${booking.barberName}, ${formatDateLong(
                  dateObj
                )} ${booking.timeSlot} WIB).`
              )
            }
          />
          <Button
            title="Kembali ke Beranda"
            size="lg"
            onPress={goToHome}
          />
        </View>
      </ScrollView>
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
  checkmarkCircle: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    marginTop: 4,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  ticketCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
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
    marginBottom: Spacing.sm,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ticketLogo: {
    width: 36,
    height: 36,
  },
  ticketBrand: {
    fontSize: 16,
    fontWeight: '800',
  },
  ticketShop: {
    fontSize: 11,
  },
  qrBox: {
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  qrInner: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrScanHint: {
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
  ticketId: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
  ticketDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
    overflow: 'hidden',
  },
  notch: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  notchLeft: {
    marginLeft: -12,
  },
  notchRight: {
    marginRight: -12,
  },
  dividerDashed: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  ticketBody: {
    padding: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  infoVal: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoValHighlight: {
    fontSize: 15,
    fontWeight: '800',
  },
  servicesBreakdown: {
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
    marginTop: 4,
  },
  servicesLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 13,
  },
  servicePrice: {
    fontSize: 13,
    fontWeight: '500',
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 6,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  actions: {
    marginTop: Spacing.lg,
    gap: 10,
  },
});