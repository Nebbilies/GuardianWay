import type { TextStyle } from 'react-native';

export const colors = {
  background: '#EEF1F2',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF1F2',
  surfaceSelected: '#F8E9E2',
  text: '#18242F',
  textMuted: '#5F6B73',
  textDisabled: '#7B858C',
  border: '#D2D6D8',
  primary: '#18242F',
  primaryPressed: '#101A22',
  onPrimary: '#FFFFFF',
  accent: '#C65A24',
  focus: '#C65A24',
  disabled: '#D2D6D8',
  overlay: 'rgba(24, 36, 47, 0.48)',
  success: '#2F6B4F',
  successSurface: '#E8F2ED',
  warning: '#8A5A12',
  warningSurface: '#FFF4D6',
  danger: '#B42318',
  dangerPressed: '#8F1C13',
  dangerSurface: '#FDECEA',
  info: '#2F5F8F',
  infoSurface: '#EAF1F8',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  section: 48,
  layout: 64,
} as const;

export const radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
} as const;

export const fonts = {
  regular: 'NotoSans_400Regular',
  medium: 'NotoSans_500Medium',
  semibold: 'NotoSans_600SemiBold',
  bold: 'NotoSans_700Bold',
  mono: 'monospace',
} as const;

export const typography = {
  display: { fontFamily: fonts.bold, fontSize: 40, lineHeight: 48 },
  pageTitle: { fontFamily: fonts.bold, fontSize: 32, lineHeight: 40 },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 32 },
  componentTitle: { fontFamily: fonts.semibold, fontSize: 20, lineHeight: 28 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24 },
  compact: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  label: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16 },
  mono: { fontFamily: fonts.mono, fontSize: 13, lineHeight: 20 },
} satisfies Record<string, TextStyle>;

export const motion = {
  fast: 150,
  standard: 220,
} as const;

export const theme = {
  colors,
  spacing,
  radius,
  fonts,
  typography,
  motion,
  controlHeight: 48,
  compactControlHeight: 44,
  maxContentWidth: 800,
} as const;

export type AppTheme = typeof theme;
export type ThemeColor = keyof typeof colors;
export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radius;
export type TextVariant = keyof typeof typography;
export type TextTone =
  | 'default'
  | 'muted'
  | 'inverse'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';
