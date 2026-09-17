import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getServices, getBarbers } from '../../services/firestore';
import { Service, Barber } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Colors, Typography, Spacing, Layout, Radius } from '../../constants';
import { formatRupiah } from '../../utils/format';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { profile, user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstName = (profile?.name || user?.displayName || 'Pengguna').split(' ')[0];

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [serviceData, barberData] = await Promise.all([
        getServices(),
        getBarbers(),
      ]);
      setServices(serviceData);
      setBarbers(barberData);
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

  const goToBooking = () => {
    navigation.navigate('Booking' as never);
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Memuat...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
          />
        }>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Halo, {firstName}!</Text>
            <Text style={styles.subGreeting}>Siap tampil rapi hari ini?</Text>
          </View>
          {user?.photoURL ? (
            <TouchableOpacity onPress={() => navigation.navigate('Profile' as never)}>
              <Ionicons name="person-circle" size={44} color={Colors.primary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={22} color={Colors.white} />
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.ctaHero}
          onPress={goToBooking}
          activeOpacity={0.9}>
          <Ionicons name="cut" size={32} color={Colors.white} />
          <View style={styles.ctaText}>
            <Text style={styles.ctaTitle}>Buat Jadwal Baru</Text>
            <Text style={styles.ctaSubtitle}>
              Pilih layanan, kapster, dan jam tanpa antre
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={Colors.white} />
        </TouchableOpacity>

        <Card>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Kapster Kami</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.barberList}>
            {barbers.map((barber) => (
              <View key={barber.id} style={styles.barberCard}>
                {barber.photoURL ? (
                  <Ionicons name="person-circle" size={48} color={Colors.primary} />
                ) : (
                  <View style={styles.barberAvatar}>
                    <Ionicons name="person" size={22} color={Colors.white} />
                  </View>
                )}
                <Text style={styles.barberName}>{barber.name}</Text>
                {barber.specialty ? (
                  <Text style={styles.barberSpecialty}>{barber.specialty}</Text>
                ) : null}
              </View>
            ))}
            {barbers.length === 0 ? (
              <Text style={styles.emptyText}>Belum ada kapster</Text>
            ) : null}
          </ScrollView>
        </Card>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Button title="Coba Lagi" onPress={loadData} size="sm" />
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Layanan & Harga</Text>
        </View>
        {services.map((service) => (
          <Card key={service.id} style={styles.serviceCard}>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.serviceDesc}>{service.description}</Text>
              <View style={styles.serviceMeta}>
                <Text style={styles.servicePrice}>{formatRupiah(service.price)}</Text>
                <Text style={styles.serviceDuration}>
                  {service.durationMinutes} menit
                </Text>
              </View>
            </View>
            <Ionicons name="cut" size={26} color={Colors.primary} />
          </Card>
        ))}
        {services.length === 0 && !error ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Belum ada layanan tersedia</Text>
          </View>
        ) : null}
      </ScrollView>
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
  content: {
    padding: Layout.screenPadding,
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  greeting: {
    ...Typography.h3,
    color: Colors.text,
  },
  subGreeting: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaHero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  ctaText: {
    flex: 1,
  },
  ctaTitle: {
    ...Typography.h4,
    color: Colors.white,
  },
  ctaSubtitle: {
    ...Typography.caption,
    color: '#DBEAFE',
    marginTop: 2,
  },
  sectionHeader: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text,
  },
  barberList: {
    gap: Spacing.md,
  },
  barberCard: {
    alignItems: 'center',
    width: 96,
  },
  barberAvatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  barberName: {
    ...Typography.captionMedium,
    color: Colors.text,
    textAlign: 'center',
  },
  barberSpecialty: {
    ...Typography.small,
    color: Colors.textLight,
    textAlign: 'center',
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  serviceDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  servicePrice: {
    ...Typography.bodyMedium,
    color: Colors.primaryDark,
  },
  serviceDuration: {
    ...Typography.caption,
    color: Colors.textLight,
  },
  errorBox: {
    backgroundColor: Colors.errorLight,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  errorText: {
    ...Typography.body,
    color: Colors.text,
    textAlign: 'center',
  },
  emptyBox: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textLight,
    textAlign: 'center',
  },
});