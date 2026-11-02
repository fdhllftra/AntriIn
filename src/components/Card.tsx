import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp, TouchableOpacity } from 'react-native';
import { Radius } from '../constants';
import { useTheme } from '../contexts/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, style, onPress }) => {
  const { colors } = useTheme();

  const containerStyle = [
    styles.card,
    {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.75} onPress={onPress} style={containerStyle}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{children}</View>;
};

export const CardTitle: React.FC<{ title: string; subtitle?: string }> = ({
  title,
  subtitle,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.titleContainer}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  titleContainer: {
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
});