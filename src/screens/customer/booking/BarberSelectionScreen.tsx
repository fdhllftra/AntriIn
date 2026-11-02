import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getBarbers, getReviewsByBarber } from '../../../services/firestore';
import { Barber } from '../../../types';
import { BookingStackParamList } from '../../../navigation/types';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { BookingStepIndicator } from '../../../components/BookingStepIndicator';
import { Typography, Spacing, Layout, Radius } from '../../../constants';
import { useTheme } from '../../../contexts/ThemeContext';
import { formatRupiah } from '../../../utils/format';

type NavigationProp = NativeStackNavigationProp<
  BookingStackParamList,
  'BarberSelection'
>;
type RoutePropType = RouteProp<BookingStackParamList, 'BarberSelection'>;

export const BarberSelectionScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { colors, isDark } = useTheme();
  const { services } = route.params;

  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [barberRatings, setBarberRatings] = useState<
    Record<string, { average: number; count: number }>
  >({});
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPrice = services.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = services.reduce((sum, s) => sum + s.durationMinutes, 0);

  const loadBarbers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBarbers();
      setBarbers(data);

      const ratingResults = await Promise.all(
        data.map(async (barber) => {
          const reviews = await getReviewsByBarber(barber.id);
          const total = reviews.reduce((sum, rev) => sum + rev.rating, 0);
          return {
            barberId: barber.id,
            average: reviews.length ? total / reviews.length : 5.0,
            count: reviews.length,
          };
        })
      );
      const ratingMap: Record<string, { average: number; count: number }> = {};
      ratingResults.forEach((r) => {
        ratingMap[r.barberId] = { average: r.average, count: r.count };
      });
      setBarberRatings(ratingMap);
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
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Memuat kapster...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.textLight} />
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
        <Button title="Coba Lagi" onPress={loadBarbers} />
      </SafeAreaView>
    );
  }

  const selectedBarber = barbers.find((b) => b.id === selectedBarberId);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Stepper UX */}
      <BookingStepIndicator currentStep={2} />

      <FlatList
        data={barbers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            {/* Selected Services Mini Summary */}
            <View style={[styles.summaryBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.summaryTopRow}>
                <Text style={[styles.summaryTitle, { color: colors.textSecondary }]}>Layanan Dipilih</Text>
                <Text style={[styles.summaryTotalValue, { color: colors.primaryDark }]}>{formatRupiah(totalPrice)}</Text>
              </View>
              <Text style={[styles.summaryServiceList, { color: colors.text }]}>
                {services.map((s) => s.name).join(' • ')} (~{totalDuration} menit)
              </Text>
            </View>

            <View style={styles.headerInfo}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Pilih Kapster</Text>
              <Text style={[styles.instruction, { color: colors.textSecondary }]}>
                Pilih kapster yang akan melayani potongan rambut Anda
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const selected = selectedBarberId === item.id;
          const rating = barberRatings[item.id];

          return (
            <TouchableOpacity
              onPress={() => setSelectedBarberId(item.id)}
              activeOpacity={0.85}>
              <Card
                style={[
                  styles.barberCard,
                  selected
                    ? {
                        borderColor: colors.primary,
                        backgroundColor: isDark ? colors.surfaceVariant : '#EFF6FF',
                      }
                    : null,
                ]}>
                <View style={[styles.avatarWrap, { backgroundColor: isDark ? colors.surfaceVariant : '#EFF6FF' }]}>
                  {item.photoURL ? (
                    <Image source={{ uri: item.photoURL }} style={styles.avatar} />
                  ) : (
                    <Ionicons name="person" size={26} color={colors.primary} />
                  )}
                </View>

                <View style={styles.barberInfo}>
                  <Text style={[styles.barberName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.barberSpecialty, { color: colors.textSecondary }]}>
                    {item.specialty || 'General Stylist'}
                  </Text>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={13} color="#F59E0B" />
                    <Text style={[styles.ratingText, { color: colors.text }]}>
                      {rating?.average ? rating.average.toFixed(1) : '5.0'}
                    </Text>
                    <Text style={[styles.ratingCount, { color: colors.textLight }]}>
                      ({rating?.count || 0} ulasan)
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.radio,
                    { borderColor: colors.border },
                    selected && { borderColor: colors.primary, backgroundColor: colors.primary },
                  ]}>
                  {selected && (
                    <Ionicons name="checkmark" size={14} color={colors.white} />
                  )}
                </View>
              </Card>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>
              Belum ada kapster aktif. Hubungi admin barbershop.
            </Text>
          </View>
        }
      />

      {/* Sticky Bottom Next Button */}
      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
        <Button
          title={selectedBarber ? `Lanjut Jadwal bersama ${selectedBarber.name}` : 'Pilih Kapster Terlebih Dahulu'}
          size="lg"
          disabled={!selectedBarberId}
          iconPosition="right"
          icon={<Ionicons name="arrow-forward" size={18} color={colors.white} />}
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
  listContent: {
    padding: Layout.screenPadding,
    paddingBottom: Spacing.xl,
  },
  summaryBox: {
    padding: 12,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryTotalValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  summaryServiceList: {
    fontSize: 13,
    fontWeight: '600',
  },
  headerInfo: {
    marginBottom: Spacing.md,
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
  barberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 10,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  barberInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  barberName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  barberSpecialty: {
    fontSize: 12,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
  },
  ratingCount: {
    fontSize: 11,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    padding: Layout.screenPadding,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
  },
});