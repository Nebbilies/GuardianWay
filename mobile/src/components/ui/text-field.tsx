import { useId, useState } from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { AppText } from '@/components/app-text';
import { Stack } from '@/components/stack';
import { useTheme } from '@/hooks/use-theme';

export type TextFieldProps = TextInputProps & {
  label: string;
  helperText?: string;
  error?: string;
  optional?: boolean;
};

export function TextField({
  label,
  helperText,
  error,
  optional = false,
  editable = true,
  style,
  onFocus,
  onBlur,
  ...props
}: TextFieldProps) {
  const { colors, controlHeight, radius, spacing, typography } = useTheme();
  const [focused, setFocused] = useState(false);
  const inputId = useId();
  const supportingText = error ?? helperText;

  return (
    <Stack gap="sm">
      <AppText nativeID={`${inputId}-label`} variant="compact">
        {label}
        {optional ? (
          <AppText variant="compact" tone="muted">
            {' '}(không bắt buộc)
          </AppText>
        ) : null}
      </AppText>
      <TextInput
        accessibilityLabel={label}
        accessibilityState={{ disabled: !editable }}
        aria-describedby={supportingText ? `${inputId}-support` : undefined}
        aria-invalid={Boolean(error)}
        aria-labelledby={`${inputId}-label`}
        editable={editable}
        nativeID={inputId}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.accent}
        style={[
          styles.input,
          {
            minHeight: controlHeight,
            borderColor: error ? colors.danger : focused ? colors.focus : colors.border,
            borderRadius: radius.sm,
            color: editable ? colors.text : colors.textDisabled,
            backgroundColor: editable ? colors.surface : colors.surfaceMuted,
            ...typography.body,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
          },
          style,
        ]}
        {...props}
      />
      {supportingText ? (
        <AppText
          accessibilityLiveRegion={error ? 'polite' : 'none'}
          nativeID={`${inputId}-support`}
          variant="label"
          tone={error ? 'danger' : 'muted'}>
          {supportingText}
        </AppText>
      ) : null}
    </Stack>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
  },
});
