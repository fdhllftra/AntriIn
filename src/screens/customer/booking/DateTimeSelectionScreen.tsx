import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getBookedSlots, getBlockedSlots } from '../../../services/firestore';
import { BookingStackParamList } from '../../../navigation/types';
import { Button } from '../../../components/Button';
import { BookingStepIndicator } from '../../../components/BookingStepIndicator';
import { SlotGridSkeleton } from '../../../components/Skeleton';
import { Typography, Spacing, Layout, Radius } from '../../../constants';
import { useTheme } from '../../../contexts/ThemeContext';
import { getDateOptions, generateTimeSlots, TimeSlot } from '../../../utils/dates';
import { formatDateLong } from '../../../utils/format';

type NavigationProp = NativeStackNavigationProp<
  BookingStackParamList,
  'DateTimeSelection'
>;
type RoutePropType = RouteProp<BookingStackParamList, 'DateTimeSelection'>;

const DATE_OPTIONS = getDateOptions(7);

export const DateTimeSelectionScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { colors, isDark } = useTheme();
  const { services, barber } = route.params;

  const [selectedDate, setSelectedDate] = useState(DATE_OPTIONS[0].value);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSlots = useCallback(
    async (date: string) => {
      setLoading(true);
      setError(null);
      setSelectedSlot(null);
      try {
        const [bookedSlots, blockedList] = await Promise.all([
          getBookedSlots(barber.id, date),
          getBlockedSlots(date),
        ]);
        const blockedTimes = blockedList.map((b) => b.timeSlot);
        setSlots(generateTimeSlots(bookedSlots, blockedTimes));
      } catch (err) {
        setError('Gagal memuat ketersediaan slot. Periksa koneksi Anda.');
        console.error(err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [barber.id]
  );

  useEffect(() => {
    loadSlots(selectedDate);
  }, [selectedDate, loadSlots]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadSlots(selectedDate);
  };

  const selectedDateObj =
    DATE_OPTIONS.find((o) => o.value === selectedDate)?.date ?? DATE_OPTIONS[0].date;

  // Group slots by period for great readability
  const morningSlots = useMemo(
    () => slots.filter((s) => s.time < '12:00'),
    [slots]
  );
  const afternoonSlots = useMemo(
    () => slots.filter((s) => s.time >= '12:00' && s.time < '16:00'),
    [slots]
  );
  const eveningSlots = useMemo(
    () => slots.filter((s) => s.time >= '16:00'),
    [slots]
  );

  const renderSlotGrid = (items: TimeSlot[]) => (
    <View style={styles.grid}>
      {items.map((item) => {
        const isSelected = selectedSlot === item.time;
        const isBooked = !item.available && !item.blocked;
        const isBlocked = item.blocked;

        return (
          <TouchableOpacity
            key={item.time}
            disabled={!item.available || refreshing}
            onPress={() => setSelectedSlot(item.time)}
            activeOpacity={0.8}
            style={[
              styles.slotBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
              isBlocked && {
                backgroundColor: isDark ? '#451A03' : '#FEF3C7',
                borderColor: '#F59E0B',
                opacity: 0.7,
              },
              isBooked && {
                backgroundColor: isDark ? '#3E1F1F' : '#FEE2E2',
                borderColor: '#EF4444',
                opacity: 0.7,
              },
              isSelected && {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
                opacity: 1,
              },
            ]}>
            <Text
              style={[
                styles.slotTimeText,
                {
                  color: isSelected ? colors.white : colors.text,
                },
                (isBooked || isBlocked) && {
                  color: colors.textSecondary,
                  textDecorationLine: 'line-through',
                },
              ]}>
              {item.time}
            </Text>
            <Text
              style={[
                styles.slotStatusText,
                {
                  color: isSelected
                    ? colors.white
                    : isBlocked
                    ? '#B45309'
                    : isBooked
                    ? '#DC2626'
                    : colors.secondary,
                },
              ]}>
              {isSelected ? 'Dipilih' : isBlocked ? 'Tutup' : isBooked ? 'Penuh' : 'Tersedia'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Stepper UX */}
      <BookingStepIndicator currentStep={3} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Date Section */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Pilih Tanggal</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Tersedia 7 hari ke depan</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateList}>
            {DATE_OPTIONS.map((option, idx) => {
              const selected = option.value === selectedDate;
              const isToday = idx === 0;
              const isTomorrow = idx === 1;

              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setSelectedDate(option.value)}
                  style={[
                    styles.dateCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                    selected && {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                    },
                  ]}
                  activeOpacity={0.8}>
                  <Text
                    style={[
                      styles.dateDayTag,
                      { color: selected ? colors.white : colors.textLight },
                    ]}>
                    {isToday ? 'Hari Ini' : isTomorrow ? 'Besok' : option.label.split(',')[0]}
                  </Text>
                  <Text
                    style={[
                      styles.dateNumberText,
                      { color: selected ? colors.white : colors.text },
                    ]}>
                    {option.label.split(',')[1]?.trim() || option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Selected Date Summary & Refresh */}
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.summaryLeft}>
            <Ionicons name="person-circle-outline" size={24} color={colors.primary} />
            <View>
              <Text style={[styles.barberTag, { color: colors.text }]}>Kapster: {barber.name}</Text>
              <Text style={[styles.dateDetailText, { color: colors.textSecondary }]}>
                {formatDateLong(selectedDateObj)}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleRefresh}
            style={[styles.refreshPill, { backgroundColor: colors.surfaceVariant }]}
            activeOpacity={0.7}>
            <Ionicons
              name="refresh"
              size={14}
              color={refreshing ? colors.textLight : colors.primary}
            />
            <Text style={[styles.refreshPillText, { color: colors.primary }]}>Cek Slot</Text>
          </TouchableOpacity>
        </View>

        {/* Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.secondary }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Tersedia</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Dipilih</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Penuh</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Ditutup</Text>
          </View>
        </View>

        {/* Slots Content */}
        {error ? (
          <View style={[styles.errorBox, { backgroundColor: colors.errorLight }]}>
            <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
            <Button title="Coba Lagi" onPress={handleRefresh} size="sm" />
          </View>
        ) : loading ? (
          <View style={{ paddingVertical: 12 }}>
            <SlotGridSkeleton />
          </View>
        ) : (
          <View style={styles.timeSection}>
            {morningSlots.length > 0 && (
              <View style={styles.periodGroup}>
                <View style={styles.periodHeader}>
                  <Ionicons name="sunny-outline" size={16} color="#F59E0B" />
                  <Text style={[styles.periodTitle, { color: colors.text }]}>Pagi (09:00 - 11:30)</Text>
                </View>
                {renderSlotGrid(morningSlots)}
              </View>
            )}

            {afternoonSlots.length > 0 && (
              <View style={styles.periodGroup}>
                <View style={styles.periodHeader}>
                  <Ionicons name="partly-sunny-outline" size={16} color="#3B82F6" />
                  <Text style={[styles.periodTitle, { color: colors.text }]}>Siang (12:00 - 15:30)</Text>
                </View>
                {renderSlotGrid(afternoonSlots)}
              </View>
            )}

            {eveningSlots.length > 0 && (
              <View style={styles.periodGroup}>
                <View style={styles.periodHeader}>
                  <Ionicons name="moon-outline" size={16} color="#8B5CF6" />
                  <Text style={[styles.periodTitle, { color: colors.text }]}>Sore & Malam (16:00 - 21:00)</Text>
                </View>
                {renderSlotGrid(eveningSlots)}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Next Button */}
      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
        <View style={styles.footerInfo}>
          <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>
            {selectedSlot ? `Jam Dipilih: ${selectedSlot} WIB` : 'Pilih salah satu jam yang tersedia'}
          </Text>
        </View>
        <Button
          title={selectedSlot ? `Konfirmasi Booking (${selectedSlot} WIB)` : 'Pilih Jam Terlebih Dahulu'}
          size="lg"
          disabled={!selectedSlot || loading}
          iconPosition="right"
          icon={<Ionicons name="arrow-forward" size={18} color={colors.white} />}
          onPress={() => {
            if (selectedSlot) {
              navigation.navigate('Confirmation', {
                services,
                barber,
                date: selectedDate,
                timeSlot: selectedSlot,
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
  content: {
    padding: Layout.screenPadding,
    paddingBottom: Spacing.xl,
  },
  sectionWrap: {
    marginBottom: Spacing.md,
  },
  sectionHeaderRow: {
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 12,
  },
  dateList: {
    gap: 10,
    paddingVertical: 4,
  },
  dateCard: {
    width: 90,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDayTag: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  dateNumberText: {
    fontSize: 13,
    fontWeight: '800',
  },
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  barberTag: {
    fontSize: 13,
    fontWeight: '700',
  },
  dateDetailText: {
    fontSize: 11,
    marginTop: 2,
  },
  refreshPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
  },
  refreshPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
    paddingVertical: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 13,
    marginTop: 8,
  },
  errorBox: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
    gap: 10,
    marginVertical: Spacing.md,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
  },
  timeSection: {
    gap: Spacing.md,
  },
  periodGroup: {
    marginBottom: Spacing.xs,
  },
  periodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  periodTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotBtn: {
    width: '31%',
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotTimeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  slotStatusText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  footer: {
    padding: Layout.screenPadding,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
  },
  footerInfo: {
    marginBottom: Spacing.sm,
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});