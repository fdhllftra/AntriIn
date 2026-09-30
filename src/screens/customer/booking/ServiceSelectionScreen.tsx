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
import { Service } from '../../../types';
import { BookingStackParamList } from '../../../navigation/types';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { Colors, Typography, Spacing, Layout, Radius } from '../../../constants';
import { formatRupiah } from '../../../utils/format';

type NavigationProp = NativeStackNavigationProp<
  BookingStackParamList,
  'ServiceSelection'
>;

export const ServiceSelectionScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
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

  const toggleService = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const selectedServices = services.filter((s) => selectedIds.includes(s.id));
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Memuat layanan...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={48} color={Colors.textLight} />
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Coba Lagi" onPress={loadServices} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Text style={styles.instruction}>
            Pilih satu atau beberapa layanan yang Anda inginkan
          </Text>
        }
        renderItem={({ item }) => {
          const selected = selectedIds.includes(item.id);
          return (
            <TouchableOpacity
              onPress={() => toggleService(item.id)}
              activeOpacity={0.8}>
              <Card
                style={[
                  styles.serviceCard,
                  selected ? styles.serviceCardSelected : null,
                ]}>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{item.name}</Text>
                  <Text style={styles.serviceDesc}>{item.description}</Text>
                  <View style={styles.serviceMeta}>
                    <Text style={styles.servicePrice}>
                      {formatRupiah(item.price)}
                    </Text>
                    <Text style={styles.serviceDuration}>
                      {item.durationMinutes} menit
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.checkbox,
                    selected && styles.checkboxSelected,
                  ]}>
                  <Ionicons
                    name="checkmark"
                    size={18}
                    color={Colors.white}
                  />
                </View>
              </Card>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.errorText}>
              Belum ada layanan tersedia. Hubungi admin barbershop.
            </Text>
          </View>
        }
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatRupiah(totalPrice)}</Text>
        </View>
        <Button
          title="Lanjut"
          size="lg"
          disabled={selectedIds.length === 0}
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
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.screenPadding,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  errorText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginVertical: Spacing.md,
  },
  listContent: {
    padding: Layout.screenPadding,
    paddingBottom: Spacing.xl,
  },
  instruction: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  serviceCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    ...Typography.h4,
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
    marginTop: Spacing.sm,
    gap: Spacing.md,
  },
  servicePrice: {
    ...Typography.bodyMedium,
    color: Colors.primaryDark,
  },
  serviceDuration: {
    ...Typography.caption,
    color: Colors.textLight,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.md,
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  footer: {
    padding: Layout.screenPadding,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  totalLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  totalValue: {
    ...Typography.h3,
    color: Colors.primaryDark,
  },
});