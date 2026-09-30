import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
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
import { Badge } from '../../../components/Badge';
import { Colors, Typography, Spacing, Layout, Radius } from '../../../constants';
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.dateSection}>
          <Text style={styles.sectionTitle}>Pilih Tanggal</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateList}>
            {DATE_OPTIONS.map((option) => {
              const selected = option.value === selectedDate;
              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setSelectedDate(option.value)}
                  style={[
                    styles.dateChip,
                    selected && styles.dateChipSelected,
                  ]}>
                  <Text
                    style={[
                      styles.dateChipLabel,
                      selected && styles.dateChipLabelSelected,
                    ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.slotHeader}>
          <Text style={styles.sectionTitle}>Pilih Jam</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshBtn}>
            <Ionicons
              name="refresh"
              size={16}
              color={refreshing ? Colors.textLight : Colors.primary}
            />
            <Text style={styles.refreshText}>Segarkan</Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Button title="Coba Lagi" onPress={handleRefresh} size="sm" />
          </View>
        ) : loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Memuat slot...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.dateInfo}>
              {formatDateLong(selectedDateObj)} - Kapster {barber.name}
            </Text>
            <FlatList
              data={slots}
              keyExtractor={(item) => item.time}
              scrollEnabled={false}
              numColumns={3}
              columnWrapperStyle={styles.slotRow}
              renderItem={({ item }) => {
                const isSelected = selectedSlot === item.time;
                return (
                  <TouchableOpacity
                    disabled={!item.available || refreshing}
                    onPress={() => setSelectedSlot(item.time)}
                    style={[
                      styles.slot,
                      item.blocked && styles.slotBlocked,
                      !item.available && !item.blocked && styles.slotTaken,
                      isSelected && styles.slotSelected,
                    ]}>
                    <Text
                      style={[
                        styles.slotTime,
                        isSelected && styles.slotTimeSelected,
                      ]}>
                      {item.time}
                    </Text>
                    {!item.available ? (
                      <Text style={styles.slotStatus}>Tidak tersedia</Text>
                    ) : null}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.center}>
                  <Text style={styles.errorText}>
                    Tidak ada slot tersedia pada tanggal ini.
                  </Text>
                </View>
              }
            />
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.legend}>
          <Badge label="Tersedia" type="success" />
          <Badge label="Terisi" type="error" />
          <Badge label="Ditutup" type="warning" />
        </View>
        <Button
          title="Lanjut"
          size="lg"
          disabled={!selectedSlot}
          onPress={() =>
            navigation.navigate('Confirmation', {
              services,
              barber,
              date: selectedDate,
              timeSlot: selectedSlot!,
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
  content: {
    padding: Layout.screenPadding,
    paddingBottom: Spacing.xl,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  dateSection: {
    marginBottom: Spacing.lg,
  },
  dateList: {
    gap: Spacing.sm,
  },
  dateChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dateChipLabel: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
  },
  dateChipLabelSelected: {
    color: Colors.white,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: Spacing.xs,
  },
  refreshText: {
    ...Typography.captionMedium,
    color: Colors.primary,
  },
  dateInfo: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  slotRow: {
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  slot: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  slotTime: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  slotStatus: {
    ...Typography.small,
    color: Colors.textLight,
    marginTop: 2,
  },
  slotBlocked: {
    backgroundColor: Colors.warningLight,
    borderColor: '#FCD34D',
    opacity: 0.9,
  },
  slotTaken: {
    backgroundColor: Colors.errorLight,
    borderColor: '#FCA5A5',
    opacity: 0.8,
  },
  slotSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  slotTimeSelected: {
    color: Colors.white,
  },
  errorBox: {
    backgroundColor: Colors.errorLight,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  errorText: {
    ...Typography.body,
    color: Colors.text,
    textAlign: 'center',
  },
  footer: {
    padding: Layout.screenPadding,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
    gap: Spacing.sm,
  },
  legend: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
});