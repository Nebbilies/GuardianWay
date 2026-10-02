import { Text, type TextProps } from 'react-native';

import type { TextTone, TextVariant } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type AppTextProps = TextProps & {
  variant?: TextVariant;
  tone?: TextTone;
};

export function AppText({ style, variant = 'body', tone = 'default', ...props }: AppTextProps) {
  const { colors, typography } = useTheme();
  const toneColor = {
    default: colors.text,
    muted: colors.textMuted,
    inverse: colors.onPrimary,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
    info: colors.info,
  }[tone];

  return (
    <Text style={[{ flexShrink: 1 }, typography[variant], { color: toneColor }, style]} {...props} />
  );
}
