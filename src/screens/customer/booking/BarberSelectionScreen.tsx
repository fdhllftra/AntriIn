import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getBarbers } from '../../../services/firestore';
import { Barber } from '../../../types';
import { BookingStackParamList } from '../../../navigation/types';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { Colors, Typography, Spacing, Layout, Radius } from '../../../constants';
import { formatRupiah } from '../../../utils/format';

type NavigationProp = NativeStackNavigationProp<
  BookingStackParamList,
  'BarberSelection'
>;
type RoutePropType = RouteProp<BookingStackParamList, 'BarberSelection'>;

export const BarberSelectionScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { services } = route.params;

  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPrice = services.reduce((sum, s) => sum + s.price, 0);

  const loadBarbers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBarbers();
      setBarbers(data);
    } catch (err) {
      setError('Gagal memuat daftar kapster. Periksa koneksi Anda.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBarbers();
  }, [loadBarbers]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Memuat kapster...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={48} color={Colors.textLight} />
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Coba Lagi" onPress={loadBarbers} />
      </SafeAreaView>
    );
  }

  const selectedBarber = barbers.find((b) => b.id === selectedBarberId);

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={barbers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Layanan dipilih</Text>
            {services.map((s) => (
              <View key={s.id} style={styles.summaryRow}>
                <Text style={styles.summaryService}>{s.name}</Text>
                <Text style={styles.summaryPrice}>{formatRupiah(s.price)}</Text>
              </View>
            ))}
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotal}>Total</Text>
              <Text style={styles.summaryTotalValue}>{formatRupiah(totalPrice)}</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const selected = selectedBarberId === item.id;
          return (
            <TouchableOpacity
              onPress={() => setSelectedBarberId(item.id)}
              activeOpacity={0.8}>
              <Card
                style={[
                  styles.barberCard,
                  selected ? styles.barberCardSelected : null,
                ]}>
                {item.photoURL ? (
                  <Image source={{ uri: item.photoURL }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={24} color={Colors.white} />
                  </View>
                )}
                <View style={styles.barberInfo}>
                  <Text style={styles.barberName}>{item.name}</Text>
                  {item.specialty ? (
                    <Text style={styles.barberSpecialty}>{item.specialty}</Text>
                  ) : null}
                </View>
                <View
                  style={[
                    styles.radio,
                    selected && styles.radioSelected,
                  ]}>
                  {selected ? (
                    <View style={styles.radioDot} />
                  ) : null}
                </View>
              </Card>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.errorText}>
              Belum ada kapster aktif. Hubungi admin barbershop.
            </Text>
          </View>
        }
      />

      <View style={styles.footer}>
        <Button
          title="Lanjut"
          size="lg"
          disabled={!selectedBarberId}
          onPress={() => {
            if (selectedBarber) {
              navigation.navigate('DateTimeSelection', {
                services,
                barber: selectedBarber,
              });
            }
          }}
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
  summaryBox: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryTitle: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  summaryService: {
    ...Typography.body,
    color: Colors.text,
  },
  summaryPrice: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  summaryTotal: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  summaryTotalValue: {
    ...Typography.bodyMedium,
    color: Colors.primaryDark,
  },
  barberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  barberCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceVariant,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barberInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  barberName: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  barberSpecialty: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: Colors.primary,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  footer: {
    padding: Layout.screenPadding,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
});