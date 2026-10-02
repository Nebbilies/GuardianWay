import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { AppText } from '@/components/app-text';
import { Stack } from '@/components/stack';
import { useTheme } from '@/hooks/use-theme';

type ButtonVariant = 'primary' | 'secondary' | 'destructive';
type ButtonSize = 'default' | 'compact';

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  children: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  children,
  variant = 'primary',
  size = 'default',
  loading = false,
  leftIcon,
  fullWidth = false,
  disabled = false,
  style,
  onFocus,
  onBlur,
  ...props
}: ButtonProps) {
  const { colors, compactControlHeight, controlHeight, radius, spacing } = useTheme();
  const [focused, setFocused] = useState(false);
  const inactive = disabled || loading;
  const foreground = inactive
    ? colors.textDisabled
    : variant === 'secondary'
      ? colors.primary
      : colors.onPrimary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: inactive }}
      disabled={inactive}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: size === 'compact' ? compactControlHeight : controlHeight,
          borderRadius: radius.sm,
          paddingHorizontal: size === 'compact' ? spacing.md : spacing.lg,
          backgroundColor: inactive
            ? colors.disabled
            : variant === 'primary'
              ? pressed
                ? colors.primaryPressed
                : colors.primary
              : variant === 'destructive'
                ? pressed
                  ? colors.dangerPressed
                  : colors.danger
                : pressed
                  ? colors.surfaceMuted
                  : colors.surface,
          borderColor: focused
            ? colors.focus
            : variant === 'secondary'
              ? colors.primary
              : inactive
                ? colors.disabled
                : variant === 'destructive'
                  ? colors.danger
                  : colors.primary,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
      {...props}>
      <Stack direction="row" gap="sm" align="center" justify="center">
        {loading ? <ActivityIndicator color={foreground} size="small" /> : leftIcon}
        <AppText variant="compact" style={{ color: foreground }}>
          {children}
        </AppText>
      </Stack>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 2,
    justifyContent: 'center',
  },
});
