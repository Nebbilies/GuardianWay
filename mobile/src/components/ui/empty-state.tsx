import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Stack } from '@/components/stack';
import { useTheme } from '@/hooks/use-theme';

export type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const { spacing } = useTheme();

  return (
    <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
      <Stack gap="md" align="center" style={{ maxWidth: 480 }}>
        {icon}
        <AppText variant="componentTitle" style={{ textAlign: 'center' }}>
          {title}
        </AppText>
        <AppText tone="muted" style={{ textAlign: 'center' }}>
          {description}
        </AppText>
        {action}
      </Stack>
    </View>
  );
}
