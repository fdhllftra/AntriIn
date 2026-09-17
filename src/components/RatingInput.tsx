import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../constants';

interface RatingInputProps {
  value: number;
  onChange: (value: number) => void;
  size?: number;
  readonly?: boolean;
}

export const RatingInput: React.FC<RatingInputProps> = ({
  value,
  onChange,
  size = 32,
  readonly = false,
}) => {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = value >= star;
        return readonly ? (
          <Ionicons
            key={star}
            name={filled ? 'star' : 'star-outline'}
            size={size}
            color={filled ? Colors.accent : Colors.border}
            style={styles.star}
          />
        ) : (
          <TouchableOpacity key={star} onPress={() => onChange(star)} activeOpacity={0.7}>
            <Ionicons
              name={filled ? 'star' : 'star-outline'}
              size={size}
              color={filled ? Colors.accent : Colors.border}
              style={styles.star}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export const RatingSummary: React.FC<{ average: number; count: number }> = ({
  average,
  count,
}) => (
  <View style={styles.summaryRow}>
    <Ionicons name="star" size={16} color={Colors.accent} />
    <Text style={styles.average}>{average.toFixed(1)}</Text>
    <Text style={styles.count}>({count})</Text>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginHorizontal: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  average: {
    ...Typography.captionMedium,
    color: Colors.text,
  },
  count: {
    ...Typography.caption,
    color: Colors.textLight,
  },
});