import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Share,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { Booking } from '../types';
import { Button } from './Button';
import { Badge } from './Badge';
import { useTheme } from '../contexts/ThemeContext';
import { Typography, Spacing, Radius } from '../constants';
import { formatRupiah, parseDateString, formatDateLong } from '../utils/format';
import { openWhatsApp } from '../utils/whatsapp';

interface ETicketModalProps {
  visible: boolean;
  booking: Booking | null;
  onClose: () => void;
}

export const ETicketModal: React.FC<ETicketModalProps> = ({
  visible,
  booking,
  onClose,
}) => {
  const { colors, isDark } = useTheme();

  if (!booking) return null;

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

  const statusType =
    booking.status === 'Selesai'
      ? 'success'
      : booking.status === 'Batal'
      ? 'error'
      : 'warning';

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            {/* Modal Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerTitleWrap}>
                <Ionicons name="ticket-outline" size={22} color={colors.primary} />
                <Text style={[styles.headerTitle, { color: colors.text }]}>E-Ticket Pemesanan</Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.closeBtn, { backgroundColor: colors.surfaceVariant }]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.scrollBody}
              showsVerticalScrollIndicator={false}>
              
              {/* Ticket Container */}
              <View
                style={[
                  styles.ticketCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}>
                
                {/* Brand & Status */}
                <View style={styles.ticketTop}>
                  <View style={styles.ticketHeader}>
                    <View style={styles.brandRow}>
                      <Image
                        source={require('../assets/images/app-logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                      />
                      <View>
                        <Text style={[styles.brandName, { color: colors.text }]}>AntriIn</Text>
                        <Text style={[styles.brandSub, { color: colors.textSecondary }]}>Edi Barbershop</Text>
                      </View>
                    </View>
                    <Badge label={booking.status} type={statusType} />
                  </View>

                  {/* QR Box */}
                  <View style={styles.qrContainer}>
                    <View style={styles.qrWrapper}>
                      <QRCode
                        value={qrValue}
                        size={160}
                        color="#0F172A"
                        backgroundColor="#FFFFFF"
                      />
                    </View>
                    <Text style={[styles.scanHint, { color: colors.textSecondary }]}>
                      Tunjukkan QR Code ini kepada kasir saat datang
                    </Text>
                    <Text style={[styles.bookingId, { color: colors.textLight }]}>
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

                {/* Booking Details */}
                <View style={styles.ticketBody}>
                  <View style={styles.infoGrid}>
                    <View style={styles.infoCol}>
                      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>KAPSTER</Text>
                      <Text style={[styles.infoValue, { color: colors.text }]}>{booking.barberName}</Text>
                    </View>
                    <View style={styles.infoCol}>
                      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>WAKTU</Text>
                      <Text style={[styles.infoValue, { color: colors.primaryDark }]}>{booking.timeSlot} WIB</Text>
                    </View>
                  </View>

                  <View style={styles.infoGrid}>
                    <View style={styles.infoCol}>
                      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>TANGGAL</Text>
                      <Text style={[styles.infoValue, { color: colors.text }]}>{formatDateLong(dateObj)}</Text>
                    </View>
                    <View style={styles.infoCol}>
                      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>ATAS NAMA</Text>
                      <Text style={[styles.infoValue, { color: colors.text }]}>{booking.customerName}</Text>
                    </View>
                  </View>

                  <View style={[styles.servicesList, { borderTopColor: colors.border }]}>
                    <Text style={[styles.servicesTitle, { color: colors.textSecondary }]}>LAYANAN DIPILIH</Text>
                    {booking.services.map((s) => (
                      <View key={s.id} style={styles.serviceRow}>
                        <Text style={[styles.serviceName, { color: colors.text }]}>{s.name}</Text>
                        <Text style={[styles.servicePrice, { color: colors.textSecondary }]}>{formatRupiah(s.price)}</Text>
                      </View>
                    ))}
                    <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
                      <Text style={[styles.totalLabel, { color: colors.text }]}>Total Biaya</Text>
                      <Text style={[styles.totalValue, { color: colors.primaryDark }]}>{formatRupiah(booking.totalPrice)}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionsWrap}>
                <Button
                  title="Bagikan E-Ticket"
                  variant="outline"
                  icon={<Ionicons name="share-social-outline" size={18} color={colors.primary} />}
                  onPress={handleShare}
                  style={styles.actionBtn}
                />

                <Button
                  title="Hubungi Barbershop (WA)"
                  variant="secondary"
                  icon={<Ionicons name="logo-whatsapp" size={18} color={colors.white} />}
                  onPress={() =>
                    openWhatsApp(
                      `Halo Edi Barbershop, saya ingin konfirmasi booking tiket #${booking.id} atas nama ${booking.customerName} pada ${formatDateLong(dateObj)} jam ${booking.timeSlot} WIB.`
                    )
                  }
                  style={styles.actionBtn}
                />

                <Button
                  title="Tutup Tiket"
                  variant="ghost"
                  onPress={onClose}
                  style={styles.actionBtn}
                />
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    padding: Spacing.md,
  },
  ticketCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  ticketTop: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  ticketHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 38,
    height: 38,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '800',
  },
  brandSub: {
    fontSize: 12,
  },
  qrContainer: {
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  qrWrapper: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scanHint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
  },
  bookingId: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
    letterSpacing: 0.5,
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
  infoGrid: {
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
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  servicesList: {
    borderTopWidth: 1,
    paddingTop: Spacing.md,
    marginTop: Spacing.xs,
  },
  servicesTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  serviceName: {
    fontSize: 13,
  },
  servicePrice: {
    fontSize: 13,
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  actionsWrap: {
    marginTop: Spacing.md,
    gap: 8,
  },
  actionBtn: {
    marginBottom: 2,
  },
});
