import { View, type ViewProps, type ViewStyle } from 'react-native';

import type { SpacingToken } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type StackProps = ViewProps & {
  direction?: 'row' | 'column';
  gap?: SpacingToken;
  align?: ViewStyle['alignItems'];
  justify?: ViewStyle['justifyContent'];
  wrap?: boolean;
};

export function Stack({
  direction = 'column',
  gap = 'md',
  align,
  justify,
  wrap = false,
  style,
  ...props
}: StackProps) {
  const { spacing } = useTheme();

  return (
    <View
      style={[
        {
          flexDirection: direction,
          gap: spacing[gap],
          alignItems: align,
          justifyContent: justify,
          flexWrap: wrap ? 'wrap' : 'nowrap',
        },
        style,
      ]}
      {...props}
    />
  );
}
