import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ViewStyle, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

type StatusType = 'primary' | 'success' | 'warning' | 'error' | 'neutral';

interface BadgeProps {
  label: string;
  type?: StatusType;
  style?: ViewStyle;
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  type = 'neutral',
  style,
  pulse = false,
}) => {
  const { colors, isDark } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (!pulse) return;
    const animation = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.6,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(pulseOpacity, {
            toValue: 0.25,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.85,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [pulse, pulseAnim, pulseOpacity]);

  const getTypeColors = (): { bg: string; fg: string; dot: string } => {
    switch (type) {
      case 'primary':
        return {
          bg: colors.primaryLight,
          fg: isDark ? '#93C5FD' : colors.primaryDark,
          dot: colors.primary,
        };
      case 'success':
        return {
          bg: colors.successLight,
          fg: isDark ? '#86EFAC' : colors.secondaryDark,
          dot: colors.success,
        };
      case 'warning':
        return {
          bg: colors.warningLight,
          fg: isDark ? '#FCD34D' : '#B45309',
          dot: '#D97706',
        };
      case 'error':
        return {
          bg: colors.errorLight,
          fg: isDark ? '#FCA5A5' : '#B91C1C',
          dot: colors.error,
        };
      case 'neutral':
      default:
        return {
          bg: colors.surfaceVariant,
          fg: colors.textSecondary,
          dot: colors.textSecondary,
        };
    }
  };

  const badgeColors = getTypeColors();

  return (
    <View style={[styles.badge, { backgroundColor: badgeColors.bg }, style]}>
      {pulse && (
        <View style={styles.dotContainer}>
          <Animated.View
            style={[
              styles.pulseRing,
              {
                backgroundColor: badgeColors.dot,
                transform: [{ scale: pulseAnim }],
                opacity: pulseOpacity,
              },
            ]}
          />
          <View style={[styles.pulseDot, { backgroundColor: badgeColors.dot }]} />
        </View>
      )}
      <Text style={[styles.label, { color: badgeColors.fg }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  dotContainer: {
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  pulseRing: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
