import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  ViewStyle,
  StyleProp,
  DimensionValue,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Radius, Spacing } from '../constants';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = Radius.md,
  style,
}) => {
  const { isDark } = useTheme();
  const opacityAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.85,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.35,
          duration: 850,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [opacityAnim]);

  const baseColor = isDark ? '#334155' : '#E2E8F0';

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: baseColor,
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
};

// SKELETON UNTUK HOME SCREEN
export const HomeScreenSkeleton: React.FC = () => {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Skeleton */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Skeleton width={110} height={14} style={{ marginBottom: 8 }} />
          <Skeleton width={170} height={26} borderRadius={Radius.lg} />
        </View>
        <Skeleton width={44} height={44} borderRadius={22} />
      </View>

      {/* Shop Info Skeleton */}
      <Skeleton
        height={48}
        borderRadius={Radius.lg}
        style={{ marginBottom: Spacing.md }}
      />

      {/* Active Booking Banner Skeleton */}
      <View
        style={[
          styles.skeletonCard,
          {
            backgroundColor: isDark ? colors.surface : '#F8FAFC',
            borderColor: colors.border,
            marginBottom: Spacing.lg,
          },
        ]}>
        <View style={styles.cardHeaderRow}>
          <Skeleton width={140} height={16} />
          <Skeleton width={80} height={24} borderRadius={99} />
        </View>
        <View style={styles.cardBodyRow}>
          <Skeleton width="30%" height={32} />
          <Skeleton width="30%" height={32} />
          <Skeleton width="30%" height={32} />
        </View>
        <Skeleton height={38} borderRadius={Radius.md} style={{ marginTop: 12 }} />
      </View>

      {/* Section Title Skeleton */}
      <View style={styles.sectionHeaderRow}>
        <Skeleton width={140} height={20} />
        <Skeleton width={60} height={16} />
      </View>

      {/* Services Grid Skeletons */}
      <View style={styles.gridRow}>
        <View
          style={[
            styles.serviceSkeletonCard,
            { backgroundColor: isDark ? colors.surface : '#F8FAFC', borderColor: colors.border },
          ]}>
          <Skeleton width={40} height={40} borderRadius={20} style={{ marginBottom: 12 }} />
          <Skeleton width="80%" height={16} style={{ marginBottom: 8 }} />
          <Skeleton width="50%" height={14} style={{ marginBottom: 12 }} />
          <Skeleton width="70%" height={18} />
        </View>
        <View
          style={[
            styles.serviceSkeletonCard,
            { backgroundColor: isDark ? colors.surface : '#F8FAFC', borderColor: colors.border },
          ]}>
          <Skeleton width={40} height={40} borderRadius={20} style={{ marginBottom: 12 }} />
          <Skeleton width="80%" height={16} style={{ marginBottom: 8 }} />
          <Skeleton width="50%" height={14} style={{ marginBottom: 12 }} />
          <Skeleton width="70%" height={18} />
        </View>
      </View>

      {/* Barbers Skeleton Row */}
      <View style={styles.sectionHeaderRow}>
        <Skeleton width={160} height={20} />
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Skeleton width={110} height={130} borderRadius={Radius.lg} />
        <Skeleton width={110} height={130} borderRadius={Radius.lg} />
        <Skeleton width={110} height={130} borderRadius={Radius.lg} />
      </View>
    </View>
  );
};

// SKELETON UNTUK HISTORY SCREEN
export const HistoryScreenSkeleton: React.FC = () => {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Title */}
      <Skeleton width={160} height={24} style={{ marginBottom: Spacing.md }} />

      {/* Filter Tabs Pills Skeleton */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: Spacing.lg }}>
        <Skeleton width={70} height={32} borderRadius={99} />
        <Skeleton width={75} height={32} borderRadius={99} />
        <Skeleton width={75} height={32} borderRadius={99} />
        <Skeleton width={70} height={32} borderRadius={99} />
      </View>

      {/* Booking Cards Skeletons */}
      {[1, 2, 3].map((item) => (
        <View
          key={item}
          style={[
            styles.skeletonCard,
            {
              backgroundColor: isDark ? colors.surface : '#F8FAFC',
              borderColor: colors.border,
              marginBottom: Spacing.md,
            },
          ]}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Skeleton width={32} height={32} borderRadius={16} />
              <View>
                <Skeleton width={120} height={16} style={{ marginBottom: 4 }} />
                <Skeleton width={80} height={12} />
              </View>
            </View>
            <Skeleton width={70} height={24} borderRadius={99} />
          </View>
          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />
          <View style={styles.cardBodyRow}>
            <Skeleton width="45%" height={16} />
            <Skeleton width="30%" height={16} />
          </View>
        </View>
      ))}
    </View>
  );
};

// SKELETON UNTUK SELECTION SCREENS (Service / Barber / Date)
export const SelectionScreenSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Stepper Skeleton */}
      <Skeleton height={50} borderRadius={Radius.lg} style={{ marginBottom: Spacing.md }} />
      <Skeleton width={200} height={22} style={{ marginBottom: 8 }} />
      <Skeleton width={260} height={14} style={{ marginBottom: Spacing.lg }} />

      {/* Selection Cards Skeletons */}
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.skeletonCard,
            {
              backgroundColor: isDark ? colors.surface : '#F8FAFC',
              borderColor: colors.border,
              marginBottom: Spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            },
          ]}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Skeleton width="70%" height={18} style={{ marginBottom: 6 }} />
            <Skeleton width="40%" height={14} style={{ marginBottom: 8 }} />
            <Skeleton width="50%" height={16} />
          </View>
          <Skeleton width={24} height={24} borderRadius={6} />
        </View>
      ))}
    </View>
  );
};

// SKELETON UNTUK SLOT GRID DI JAM BOOKING
export const SlotGridSkeleton: React.FC = () => {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 12 }}>
      {Array.from({ length: 9 }).map((_, i) => (
        <Skeleton
          key={i}
          width="31%"
          height={58}
          borderRadius={Radius.lg}
          style={{ marginBottom: 8 }}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingTop: Spacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  skeletonCard: {
    borderRadius: Radius.xl,
    padding: 16,
    borderWidth: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardBodyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.md,
  },
  serviceSkeletonCard: {
    flex: 1,
    borderRadius: Radius.xl,
    padding: 16,
    borderWidth: 1,
  },
});
