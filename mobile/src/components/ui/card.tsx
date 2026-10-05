import { View, type ViewProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export type CardProps = ViewProps & {
  muted?: boolean;
};

export function Card({ muted = false, style, ...props }: CardProps) {
  const { colors, radius, spacing } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: muted ? colors.surfaceMuted : colors.surface,
          borderColor: colors.border,
          borderRadius: radius.md,
          borderWidth: 1,
          padding: spacing.lg,
        },
        style,
      ]}
      {...props}
    />
  );
}
