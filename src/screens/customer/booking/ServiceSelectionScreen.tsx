import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getServices } from '../../../services/firestore';
import { subscribeToServices } from '../../../services/realtime';
import { Service } from '../../../types';
import { BookingStackParamList } from '../../../navigation/types';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { BookingStepIndicator } from '../../../components/BookingStepIndicator';
import { SelectionScreenSkeleton } from '../../../components/Skeleton';
import { Typography, Spacing, Layout, Radius } from '../../../constants';
import { useTheme } from '../../../contexts/ThemeContext';
import { formatRupiah } from '../../../utils/format';

type NavigationProp = NativeStackNavigationProp<
  BookingStackParamList,
  'ServiceSelection'
>;

export const ServiceSelectionScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getServices();
      setServices(data);
    } catch (err) {
      setError('Gagal memuat daftar layanan. Periksa koneksi Anda.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  // Perubahan katalog layanan dari Firebase langsung tampil di layar ini.
  useEffect(
    () =>
      subscribeToServices((data) => {
        setServices(data);
        setLoading(false);
      }),
    []
  );

  const toggleService = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const selectedServices = services.filter((s) => selectedIds.includes(s.id));
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <BookingStepIndicator currentStep={1} />
        <SelectionScreenSkeleton count={4} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.textLight} />
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
        <Button title="Coba Lagi" onPress={loadServices} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Stepper UX */}
      <BookingStepIndicator currentStep={1} />

      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerInfo}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Pilih Layanan</Text>
            <Text style={[styles.instruction, { color: colors.textSecondary }]}>
              Anda dapat memilih lebih dari satu layanan (misal: Potong + Cuci Rambut)
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const selected = selectedIds.includes(item.id);
          return (
            <Card
              style={styles.serviceCard}
              onPress={() => toggleService(item.id)}
              hoverable
              selected={selected}>
              <View style={styles.serviceInfo}>
                <Text style={[styles.serviceName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.serviceDesc, { color: colors.textSecondary }]}>{item.description}</Text>
                <View style={styles.serviceMeta}>
                  <Text style={[styles.servicePrice, { color: colors.primaryDark }]}>
                    {formatRupiah(item.price)}
                  </Text>
                  <View style={styles.durationPill}>
                    <Ionicons name="time-outline" size={13} color={colors.textLight} />
                    <Text style={[styles.serviceDuration, { color: colors.textSecondary }]}>
                      ~{item.durationMinutes} menit
                    </Text>
                  </View>
                </View>
              </View>
              <View
                style={[
                  styles.checkbox,
                  { borderColor: colors.border, backgroundColor: colors.surface },
                  selected && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}>
                {selected && (
                  <Ionicons name="checkmark" size={16} color={colors.white} />
                )}
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>
              Belum ada layanan tersedia. Hubungi admin barbershop.
            </Text>
          </View>
        }
      />

      {/* Sticky Bottom Summary Footer */}
      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
        <View style={styles.totalRow}>
          <View>
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>
              {selectedIds.length} Layanan Dipilih
            </Text>
            {totalDuration > 0 && (
              <Text style={[styles.totalDurationText, { color: colors.textLight }]}>
                Estimasi waktu: ~{totalDuration} menit
              </Text>
            )}
          </View>
          <Text style={[styles.totalValue, { color: colors.primaryDark }]}>{formatRupiah(totalPrice)}</Text>
        </View>
        <Button
          title={selectedIds.length === 0 ? 'Pilih Layanan Terlebih Dahulu' : 'Lanjut Pilih Kapster'}
          size="lg"
          disabled={selectedIds.length === 0}
          iconPosition="right"
          icon={<Ionicons name="arrow-forward" size={18} color={colors.white} />}
          onPress={() =>
            navigation.navigate('BarberSelection', {
              services: selectedServices,
            })
          }
        />
      </View>
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
    padding: Layout.screenPadding,
  },
  loadingText: {
    ...Typography.body,
    marginTop: Spacing.md,
  },
  errorText: {
    ...Typography.body,
    textAlign: 'center',
    marginVertical: Spacing.md,
  },
  headerInfo: {
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  instruction: {
    fontSize: 13,
    lineHeight: 18,
  },
  listContent: {
    padding: Layout.screenPadding,
    paddingBottom: Spacing.xl,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 10,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  serviceDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 6,
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '800',
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  serviceDuration: {
    fontSize: 12,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.md,
  },
  footer: {
    padding: Layout.screenPadding,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  totalDurationText: {
    fontSize: 11,
    marginTop: 2,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
  },
});