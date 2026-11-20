import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Radius, Spacing } from '../constants';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss: () => void;
  style?: StyleProp<ViewStyle>;
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'success',
  duration = 3200,
  onDismiss,
  style,
}) => {
  const { colors, isDark } = useTheme();
  const translateY = useRef(new Animated.Value(-60)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 6,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        hide();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hide();
    }
  }, [visible]);

  const hide = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -60,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!visible) return null;

  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle' as const,
          color: colors.success,
          bg: isDark ? '#064E3B' : '#ECFDF5',
          border: isDark ? '#047857' : '#A7F3D0',
        };
      case 'warning':
        return {
          icon: 'alert-circle' as const,
          color: colors.accent,
          bg: isDark ? '#78350F' : '#FFFBEB',
          border: isDark ? '#B45309' : '#FDE68A',
        };
      case 'error':
        return {
          icon: 'close-circle' as const,
          color: colors.error,
          bg: isDark ? '#7F1D1D' : '#FEF2F2',
          border: isDark ? '#B91C1C' : '#FECACA',
        };
      case 'info':
      default:
        return {
          icon: 'information-circle' as const,
          color: colors.primary,
          bg: isDark ? '#1E293B' : '#EFF6FF',
          border: isDark ? '#3B82F6' : '#BFDBFE',
        };
    }
  };

  const config = getIconAndColor();

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
          transform: [{ translateY }],
          opacity,
          ...Platform.select({
            web: {
              boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
            },
            default: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 6,
            },
          }),
        },
        style,
      ]}>
      <Ionicons name={config.icon} size={20} color={config.color} style={styles.icon} />
      <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
      <TouchableOpacity onPress={hide} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="close" size={18} color={colors.textLight} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 52,
    left: 20,
    right: 20,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  icon: {
    marginRight: 10,
  },
  message: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
});
