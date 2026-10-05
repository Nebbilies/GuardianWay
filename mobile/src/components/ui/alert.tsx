import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Stack } from '@/components/stack';
import type { TextTone } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { StatusKind } from '@/components/ui/status-badge';

export type AlertProps = {
  severity: StatusKind;
  title: string;
  children: ReactNode;
  action?: ReactNode;
};

export function Alert({ severity, title, children, action }: AlertProps) {
  const { colors, radius, spacing } = useTheme();
  const backgroundColor = {
    neutral: colors.surface,
    success: colors.successSurface,
    warning: colors.warningSurface,
    danger: colors.dangerSurface,
    info: colors.infoSurface,
  }[severity];
  const accentColor = {
    neutral: colors.textMuted,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
    info: colors.info,
  }[severity];
  const tone: TextTone = severity === 'neutral' ? 'default' : severity;

  return (
    <View
      accessibilityLiveRegion={severity === 'danger' ? 'assertive' : 'polite'}
      accessibilityRole="alert"
      style={{
        backgroundColor,
        borderColor: colors.border,
        borderLeftColor: accentColor,
        borderLeftWidth: 4,
        borderRadius: radius.md,
        borderWidth: 1,
        padding: spacing.lg,
      }}>
      <Stack gap="sm">
        <AppText variant="compact" tone={tone}>
          {title}
        </AppText>
        {typeof children === 'string' ? (
          <AppText variant="compact" tone="default">
            {children}
          </AppText>
        ) : (
          children
        )}
        {action}
      </Stack>
    </View>
  );
}
