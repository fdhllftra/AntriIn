import React, { useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  Animated,
  Platform,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}) => {
  const { colors, isDark } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 50,
      useNativeDriver: true,
    }).start();
  };

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: isHovered && !disabled ? colors.primaryDark : colors.primary,
        };
      case 'secondary':
        return {
          backgroundColor: isHovered && !disabled ? colors.secondaryDark : colors.secondary,
        };
      case 'outline':
        return {
          backgroundColor: isHovered && !disabled ? colors.primaryLight : 'transparent',
          borderWidth: 1.5,
          borderColor: colors.primary,
        };
      case 'ghost':
        return {
          backgroundColor: isHovered && !disabled
            ? (isDark ? '#334155' : '#DBEAFE')
            : (isDark ? colors.surfaceVariant : colors.primaryLight),
        };
      case 'danger':
        return {
          backgroundColor: isHovered && !disabled ? '#991B1B' : colors.error,
        };
      default:
        return { backgroundColor: colors.primary };
    }
  };

  const getLabelColor = (): string => {
    if (disabled) return colors.textLight;
    if (variant === 'outline' || variant === 'ghost') return colors.primary;
    return colors.white;
  };

  const webStyles: ViewStyle = Platform.select({
    web: {
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
      outline: 'none',
      boxShadow: isHovered && !disabled && (variant === 'primary' || variant === 'secondary')
        ? '0 4px 12px rgba(37, 99, 235, 0.28)'
        : 'none',
    },
    default: {},
  }) as ViewStyle;

  const containerStyle = [
    styles.base,
    sizes[size],
    getVariantStyle(),
    webStyles,
    disabled && styles.disabled,
    style,
  ];

  const labelStyle = [
    styles.label,
    size === 'lg' && styles.labelLg,
    { color: getLabelColor() },
    textStyle,
  ];

  const webHandlers = Platform.OS === 'web'
    ? {
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false),
      }
    : {};

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={containerStyle}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.88}
        {...webHandlers}>
        {loading ? (
          <ActivityIndicator
            color={
              variant === 'outline' || variant === 'ghost'
                ? colors.primary
                : colors.white
            }
          />
        ) : (
          <View style={styles.contentRow}>
            {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
            <Text style={labelStyle}>{title}</Text>
            {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  base: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  labelLg: {
    fontSize: 16,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.5,
  },
});

const sizes = StyleSheet.create({
  sm: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  md: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  lg: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
});
