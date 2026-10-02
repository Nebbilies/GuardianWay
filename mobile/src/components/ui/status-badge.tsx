import { View } from 'react-native';

import { AppText } from '@/components/app-text';
import type { TextTone } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type StatusKind = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export type StatusBadgeProps = {
  status: StatusKind;
  label: string;
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const { colors, radius, spacing } = useTheme();
  const backgroundColor = {
    neutral: colors.surfaceMuted,
    success: colors.successSurface,
    warning: colors.warningSurface,
    danger: colors.dangerSurface,
    info: colors.infoSurface,
  }[status];
  const tone: TextTone = status === 'neutral' ? 'muted' : status;

  return (
    <View
      accessibilityLabel={label}
      style={{
        alignSelf: 'flex-start',
        backgroundColor,
        borderRadius: radius.lg,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
      }}>
      <AppText variant="label" tone={tone}>
        {label}
      </AppText>
    </View>
  );
}
