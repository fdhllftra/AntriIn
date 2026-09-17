import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../constants';

type StatusType = 'primary' | 'success' | 'warning' | 'error' | 'neutral';

interface BadgeProps {
  label: string;
  type?: StatusType;
  style?: ViewStyle;
}

const typeColors: Record<StatusType, { bg: string; fg: string }> = {
  primary: { bg: Colors.primaryLight, fg: Colors.primaryDark },
  success: { bg: Colors.successLight, fg: Colors.secondaryDark },
  warning: { bg: Colors.warningLight, fg: '#B45309' },
  error: { bg: Colors.errorLight, fg: '#B91C1C' },
  neutral: { bg: Colors.surfaceVariant, fg: Colors.textSecondary },
};

export const Badge: React.FC<BadgeProps> = ({ label, type = 'neutral', style }) => {
  const colors = typeColors[type];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, style]}>
      <Text style={[styles.label, { color: colors.fg }]}>{label}</Text>
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