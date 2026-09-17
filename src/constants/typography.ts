import { Platform } from 'react-native';

export const Fonts = {
  regular: Platform.select({
    ios: 'System',
    android: 'normal',
    default: 'normal',
  }),
  medium: Platform.select({
    ios: 'System',
    android: 'sans-serif-medium',
    default: 'normal',
  }),
  bold: Platform.select({
    ios: 'System',
    android: 'sans-serif-bold',
    default: 'normal',
  }),
} as const;

export const Typography = {
  h1: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  h4: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  captionMedium: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  small: {
    fontSize: 10,
    fontWeight: '400',
    lineHeight: 14,
  },
} as const;

export type TypographyType = typeof Typography;