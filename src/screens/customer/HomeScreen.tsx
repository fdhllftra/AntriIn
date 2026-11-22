import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getServices, getBarbers } from '../../services/firestore';
import { Service, Barber, Booking, Review } from '../../types';
import {
  subscribeToServices,
  subscribeToBarbers,
  subscribeToReviews,
  subscribeToBookingsByCustomer,
} from '../../services/realtime';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { RatingSummary } from '../../components/RatingInput';
import { ETicketModal } from '../../components/ETicketModal';
import { HomeScreenSkeleton } from '../../components/Skeleton';
import { Colors, Typography, Spacing, Layout, Radius } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';
import { formatRupiah, parseDateString, formatDateLong } from '../../utils/format';
import { openWhatsApp } from '../../utils/whatsapp';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { profile, user } = useAuth();
  const { colors, isDark } = useTheme();
  
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Booking | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstName = (profile?.name || user?.displayName || 'Pelanggan').split(' ')[0];

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Booking, ulasan, layanan, dan kapster juga diperbarui otomatis oleh
      // listener realtime di bawah; ini hanya untuk status loading awal.
      await Promise.all([getServices(), getBarbers()]);
    } catch (err) {
      setError('Gagal memuat data. Periksa koneksi Anda.');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Realtime Firestore: setiap perubahan langsung tampil tanpa refresh ---
  useEffect(
    () =>
      subscribeToServices((data) => {
        setServices(data);
        setLoading(false);
      }),
    []
  );
  useEffect(
    () =>
      subscribeToBarbers((data) => {
        setBarbers(data);
        setLoading(false);
      }),
    []
  );
  useEffect(() => subscribeToReviews(setReviews), []);
  useEffect(() => subscribeToBookingsByCustomer(user?.uid, setBookings), [user?.uid]);

  const barberRatings = useMemo(() => {
    const map: Record<string, { average: number; count: number }> = {};
    barbers.forEach((barber) => {
      const items = reviews.filter((r) => r.barberId === barber.id);
      const total = items.reduce((sum, r) => sum + r.rating, 0);
      map[barber.id] = {
        average: items.length ? total / items.length : 0,
        count: items.length,
      };
    });
    return map;
  }, [barbers, reviews]);

  useEffect(() => {
    const pending = bookings.find((b) => b.status === 'Menunggu');
    setActiveBooking(pending || null);
  }, [bookings]);

  const goToBooking = (initialService?: Service) => {
    if (initialService) {
      (navigation as any).navigate('Booking', {
        screen: 'BarberSelection',
        params: { services: [initialService] },
      });
    } else {
      (navigation as any).navigate('Booking');
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <HomeScreenSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.primary}
            colors={[colors.primary]}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
          />
        }>
        {/* Top Header Bar */}
        <View style={styles.header}>
          <View style={styles.greetingWrap}>
            <Text style={[styles.greetingSub, { color: colors.textSecondary }]}>Selamat Datang,</Text>
            <Text style={[styles.greetingName, { color: colors.text }]}>{firstName} 👋</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile' as never)}
            activeOpacity={0.8}
            style={styles.avatarWrap}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={[styles.headerAvatar, { borderColor: colors.primary }]} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                <Ionicons name="person" size={20} color={colors.white} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Shop Info Badge */}
        <View style={[styles.shopInfoCard, { backgroundColor: isDark ? colors.surface : '#EFF6FF', borderColor: colors.border }]}>
          <View style={styles.shopInfoLeft}>
            <Ionicons name="storefront-outline" size={18} color={colors.primary} />
            <Text style={[styles.shopInfoText, { color: colors.text }]}>Edi Barbershop • Buka 09:00 - 21:00 WIB</Text>
          </View>
          <Badge label="Buka" type="success" pulse />
        </View>

        {/* ACTIVE BOOKING CARD (UX WIN: Never lose ticket!) */}
        {activeBooking && (
          <View style={[styles.activeBookingCard, { backgroundColor: isDark ? '#1E293B' : '#FEF3C7', borderColor: colors.accent }]}>
            <View style={styles.activeBookingHeader}>
              <View style={styles.activeBookingTag}>
                <Ionicons name="time" size={16} color="#B45309" />
                <Text style={styles.activeBookingTagText}>Antrean Aktif Anda</Text>
              </View>
              <Badge label="Menunggu" type="warning" pulse />
            </View>

            <View style={styles.activeBookingDetails}>
              <View style={styles.activeInfoCol}>
                <Text style={[styles.activeLabel, { color: colors.textSecondary }]}>Kapster</Text>
                <Text style={[styles.activeValue, { color: colors.text }]}>{activeBooking.barberName}</Text>
              </View>
              <View style={styles.activeInfoCol}>
                <Text style={[styles.activeLabel, { color: colors.textSecondary }]}>Jadwal</Text>
                <Text style={[styles.activeValueTime, { color: colors.primaryDark }]}>{activeBooking.timeSlot} WIB</Text>
              </View>
              <View style={styles.activeInfoCol}>
                <Text style={[styles.activeLabel, { color: colors.textSecondary }]}>Tanggal</Text>
                <Text style={[styles.activeValue, { color: colors.text }]}>{activeBooking.date}</Text>
              </View>
            </View>

            <View style={styles.activeBookingActions}>
              <Button
                title="Buka E-Ticket (QR)"
                size="sm"
                icon={<Ionicons name="qr-code-outline" size={16} color={colors.white} />}
                onPress={() => setSelectedTicket(activeBooking)}
                style={{ flex: 1 }}
              />
              <Button
                title="Hubungi"
                size="sm"
                variant="outline"
                icon={<Ionicons name="logo-whatsapp" size={16} color={colors.primary} />}
                onPress={() =>
                  openWhatsApp(
                    `Halo Edi Barbershop, saya ingin konfirmasi kedatangan antrean tiket #${activeBooking.id} (${activeBooking.timeSlot} WIB).`
                  )
                }
                style={{ flex: 0.8 }}
              />
            </View>
          </View>
        )}

        {/* Hero CTA Booking */}
        <TouchableOpacity
          style={[styles.ctaHero, { backgroundColor: colors.primary }]}
          onPress={() => goToBooking()}
          activeOpacity={0.9}>
          <View style={styles.ctaHeroLeft}>
            <View style={styles.ctaBadge}>
              <Text style={styles.ctaBadgeText}>Tanpa Antre Fisik</Text>
            </View>
            <Text style={styles.ctaTitle}>Buat Jadwal Baru</Text>
            <Text style={styles.ctaSubtitle}>
              Pilih layanan, kapster andalan, dan jam sesuai kenyamananmu
            </Text>
          </View>
          <View style={styles.ctaArrowCircle}>
            <Ionicons name="arrow-forward" size={22} color={colors.primary} />
          </View>
        </TouchableOpacity>

        {/* Barber Team Section */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Kapster Profesional</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Pilih kapster sesuai selera gayamu</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.barberListHorizontal}>
          {barbers.map((barber) => (
            <TouchableOpacity
              key={barber.id}
              style={[styles.barberTile, { backgroundColor: colors.surface, borderColor: colors.border }]}
              activeOpacity={0.8}
              onPress={() => goToBooking()}>
              <View style={[styles.barberAvatarWrap, { backgroundColor: isDark ? colors.surfaceVariant : '#EFF6FF' }]}>
                {barber.photoURL ? (
                  <Image source={{ uri: barber.photoURL }} style={styles.barberPhoto} />
                ) : (
                  <Ionicons name="person" size={28} color={colors.primary} />
                )}
              </View>
              <Text style={[styles.barberNameText, { color: colors.text }]} numberOfLines={1}>
                {barber.name}
              </Text>
              <Text style={[styles.barberSpecialtyText, { color: colors.textSecondary }]} numberOfLines={1}>
                {barber.specialty || 'General Stylist'}
              </Text>
              <View style={styles.barberRatingRow}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={[styles.barberRatingNum, { color: colors.text }]}>
                  {barberRatings[barber.id]?.average
                    ? barberRatings[barber.id].average.toFixed(1)
                    : '5.0'}
                </Text>
                <Text style={[styles.barberRatingCount, { color: colors.textLight }]}>
                  ({barberRatings[barber.id]?.count || 0})
                </Text>
              </View>
            </TouchableOpacity>
          ))}
          {barbers.length === 0 && (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Memuat daftar kapster...</Text>
          )}
        </ScrollView>

        {/* Services & Quick Book Section */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Katalog Layanan & Tarif</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Pilih langsung untuk booking cepat</Text>
          </View>
        </View>

        {services.map((service) => (
          <Card
            key={service.id}
            style={styles.serviceModernCard}
            onPress={() => goToBooking(service)}
            hoverable>
            <View style={styles.serviceMain}>
              <View style={[styles.serviceIconWrap, { backgroundColor: isDark ? colors.surfaceVariant : '#EFF6FF' }]}>
                <Ionicons name="cut" size={22} color={colors.primary} />
              </View>
              <View style={styles.serviceDetails}>
                <View style={styles.serviceHeaderLine}>
                  <Text style={[styles.serviceName, { color: colors.text }]}>{service.name}</Text>
                  <Text style={[styles.servicePriceText, { color: colors.primaryDark }]}>
                    {formatRupiah(service.price)}
                  </Text>
                </View>
                <Text style={[styles.serviceDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                  {service.description}
                </Text>
                <View style={styles.serviceFooterRow}>
                  <View style={styles.durationTag}>
                    <Ionicons name="time-outline" size={14} color={colors.textLight} />
                    <Text style={[styles.durationText, { color: colors.textSecondary }]}>
                      {service.durationMinutes} Menit
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.quickBookBtn, { backgroundColor: colors.primaryBackground }]}
                    onPress={() => goToBooking(service)}
                    activeOpacity={0.8}>
                    <Text style={[styles.quickBookText, { color: colors.primary }]}>Pesan Ini</Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Card>
        ))}

        {services.length === 0 && !error && (
          <View style={styles.emptyBox}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Belum ada layanan tersedia</Text>
          </View>
        )}
      </ScrollView>

      {/* Global E-Ticket Modal Viewer */}
      <ETicketModal
        visible={!!selectedTicket}
        booking={selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />
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
    marginTop: Spacing.md,
  },
  content: {
    padding: Layout.screenPadding,
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
  },
  greetingWrap: {
    flex: 1,
  },
  greetingSub: {
    fontSize: 13,
    fontWeight: '500',
  },
  greetingName: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  avatarWrap: {
    padding: 2,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    borderWidth: 2,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopInfoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  shopInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  shopInfoText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeBookingCard: {
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1.5,
    marginBottom: Spacing.md,
  },
  activeBookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  activeBookingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeBookingTagText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },
  activeBookingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  activeInfoCol: {
    flex: 1,
  },
  activeLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  activeValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  activeValueTime: {
    fontSize: 15,
    fontWeight: '800',
  },
  activeBookingActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.sm,
  },
  ctaHero: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  ctaHeroLeft: {
    flex: 1,
    paddingRight: 12,
  },
  ctaBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  ctaBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  ctaSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 16,
  },
  ctaArrowCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderRow: {
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  barberListHorizontal: {
    paddingVertical: 8,
    gap: 12,
    marginBottom: Spacing.md,
  },
  barberTile: {
    width: 130,
    borderRadius: Radius.xl,
    padding: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  barberAvatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  barberPhoto: {
    width: '100%',
    height: '100%',
  },
  barberNameText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
  },
  barberSpecialtyText: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 6,
  },
  barberRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  barberRatingNum: {
    fontSize: 12,
    fontWeight: '700',
  },
  barberRatingCount: {
    fontSize: 10,
  },
  serviceModernCard: {
    padding: 14,
    marginBottom: 10,
  },
  serviceMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  serviceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  serviceDetails: {
    flex: 1,
  },
  serviceHeaderLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '700',
  },
  servicePriceText: {
    fontSize: 15,
    fontWeight: '800',
  },
  serviceDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  serviceFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 12,
  },
  quickBookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
  },
  quickBookText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: 13,
  },
});