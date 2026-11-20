import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  StyleProp,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Radius } from '../constants';
import { useTheme } from '../contexts/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  hoverable?: boolean;
  selected?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  hoverable = true,
  selected = false,
}) => {
  const { colors, isDark } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      friction: 6,
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

  const isInteractive = Boolean(onPress);
  const shouldHover = isInteractive && hoverable && isHovered;

  const getBorderColor = () => {
    if (selected) return colors.primary;
    if (shouldHover) return colors.primary;
    return colors.border;
  };

  const getBackgroundColor = () => {
    if (selected) {
      return isDark ? '#1E293B' : colors.primaryLight;
    }
    if (shouldHover) {
      return isDark ? '#1E293B' : '#F8FAFC';
    }
    return colors.surface;
  };

  const hoverStyle: ViewStyle = Platform.OS === 'web'
    ? ((shouldHover
        ? {
            transform: [{ translateY: -2 }],
            boxShadow: isDark
              ? '0 6px 16px rgba(0,0,0,0.4)'
              : '0 6px 16px rgba(15, 23, 42, 0.08)',
            cursor: isInteractive ? 'pointer' : 'default',
          }
        : {
            cursor: isInteractive ? 'pointer' : 'default',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }) as unknown as ViewStyle)
    : {};

  const containerStyle = [
    styles.card,
    {
      backgroundColor: getBackgroundColor(),
      borderColor: getBorderColor(),
      borderWidth: selected ? 1.5 : 1,
    },
    hoverStyle,
    style,
  ];

  if (onPress) {
    const webHandlers = Platform.OS === 'web'
      ? {
          onMouseEnter: () => setIsHovered(true),
          onMouseLeave: () => setIsHovered(false),
        }
      : {};

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={containerStyle}
          {...webHandlers}>
          {children}
        </TouchableOpacity>
      </Animated.View>
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
