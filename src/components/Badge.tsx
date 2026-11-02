import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

type StatusType = 'primary' | 'success' | 'warning' | 'error' | 'neutral';

interface BadgeProps {
  label: string;
  type?: StatusType;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({ label, type = 'neutral', style }) => {
  const { colors, isDark } = useTheme();

  const getTypeColors = (): { bg: string; fg: string } => {
    switch (type) {
      case 'primary':
        return {
          bg: colors.primaryLight,
          fg: isDark ? '#93C5FD' : colors.primaryDark,
        };
      case 'success':
        return {
          bg: colors.successLight,
          fg: isDark ? '#86EFAC' : colors.secondaryDark,
        };
      case 'warning':
        return {
          bg: colors.warningLight,
          fg: isDark ? '#FCD34D' : '#B45309',
        };
      case 'error':
        return {
          bg: colors.errorLight,
          fg: isDark ? '#FCA5A5' : '#B91C1C',
        };
      case 'neutral':
      default:
        return {
          bg: colors.surfaceVariant,
          fg: colors.textSecondary,
        };
    }
  };

  const badgeColors = getTypeColors();

  return (
    <View style={[styles.badge, { backgroundColor: badgeColors.bg }, style]}>
      <Text style={[styles.label, { color: badgeColors.fg }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});