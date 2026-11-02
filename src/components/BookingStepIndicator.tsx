import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Radius, Spacing } from '../constants';

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3 | 4;
}

const STEPS = [
  { step: 1, label: 'Layanan', icon: 'cut-outline' as const },
  { step: 2, label: 'Kapster', icon: 'person-outline' as const },
  { step: 3, label: 'Jadwal', icon: 'calendar-outline' as const },
  { step: 4, label: 'Konfirmasi', icon: 'checkmark-circle-outline' as const },
];

export const BookingStepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.surface : '#F8FAFC', borderBottomColor: colors.border }]}>
      <View style={styles.stepsRow}>
        {STEPS.map((item, index) => {
          const isDone = item.step < currentStep;
          const isActive = item.step === currentStep;

          return (
            <React.Fragment key={item.step}>
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.circle,
                    {
                      backgroundColor: isDone
                        ? colors.success
                        : isActive
                        ? colors.primary
                        : isDark
                        ? colors.surfaceVariant
                        : '#E2E8F0',
                    },
                  ]}>
                  {isDone ? (
                    <Ionicons name="checkmark" size={14} color={colors.white} />
                  ) : (
                    <Text
                      style={[
                        styles.stepNumber,
                        {
                          color: isActive
                            ? colors.white
                            : colors.textSecondary,
                        },
                      ]}>
                      {item.step}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.label,
                    {
                      color: isActive
                        ? colors.primary
                        : isDone
                        ? colors.text
                        : colors.textLight,
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}>
                  {item.label}
                </Text>
              </View>

              {index < STEPS.length - 1 && (
                <View
                  style={[
                    styles.line,
                    {
                      backgroundColor:
                        item.step < currentStep
                          ? colors.success
                          : colors.border,
                    },
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    width: 65,
  },
  circle: {
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
  },
  label: {
    fontSize: 11,
    textAlign: 'center',
  },
  line: {
    flex: 1,
    height: 2,
    marginHorizontal: 2,
    marginBottom: 16,
  },
});
