import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '@/components/app-text';
import { Screen } from '@/components/screen';
import { Stack } from '@/components/stack';
import { Alert, StatusBadge } from '@/components/ui';
import { colors, radius, spacing, theme } from '@/constants/theme';

import type { Registration } from '../../../../fixtures/transport/contract';
import { directionLabels, formatCivilDate, serviceDirections } from './draft';

export function RegistrationPage({
  title,
  schoolName,
  onBack,
  footer,
  tabbed = false,
  children,
}: {
  title: string;
  schoolName?: string | null;
  onBack?: () => void;
  footer?: ReactNode;
  tabbed?: boolean;
  children: ReactNode;
}) {
  return (
    <Screen padding="xs" contentContainerStyle={styles.screenContent}>
      <KeyboardAvoidingView
        behavior={footer && Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.header}>
          {onBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Quay lại"
              onPress={onBack}
              style={styles.back}
            >
              <AppText variant="sectionTitle">‹</AppText>
            </Pressable>
          ) : null}
          <Stack gap="xs" style={styles.flex}>
            {schoolName ? (
              <AppText variant="label" tone="muted">
                {schoolName}
              </AppText>
            ) : null}
            <AppText
              accessibilityRole="header"
              variant={onBack ? 'componentTitle' : 'pageTitle'}
            >
              {title}
            </AppText>
          </Stack>
        </View>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.body,
            tabbed && Platform.OS === 'web' && styles.webTabInset,
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <Stack gap="md">{children}</Stack>
        </ScrollView>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </Screen>
  );
}

export function RegistrationLoadState({ error }: { error?: string }) {
  return error ? (
    <Alert severity="danger" title="Chưa tải được dữ liệu">
      {error}
    </Alert>
  ) : (
    <Stack direction="row" gap="sm" align="center">
      <ActivityIndicator color={colors.primary} />
      <AppText tone="muted">Đang tải đăng ký xe…</AppText>
    </Stack>
  );
}

const labels = {
  PENDING: { status: 'warning', label: 'Chờ duyệt' },
  APPROVED: { status: 'success', label: 'Đã duyệt' },
  REJECTED: { status: 'danger', label: 'Từ chối' },
} as const;

export function RegistrationStatus({
  status,
}: {
  status: Registration['status'];
}) {
  return <StatusBadge {...labels[status]} />;
}

export function summarizeRegistration(registration: Registration) {
  const dates = [
    ...new Set(registration.days.map((day) => day.serviceDate)),
  ].sort();
  const first = dates[0];
  const last = dates.at(-1);
  const directions = serviceDirections.filter((direction) =>
    registration.days.some((day) => day.direction === direction),
  );
  const period =
    first && last
      ? [first, ...(last === first ? [] : [last])]
          .map(formatCivilDate)
          .join(' – ')
      : '';
  const direction =
    directions.length === 2
      ? 'Cả hai chiều'
      : directions[0]
        ? directionLabels[directions[0]]
        : '';
  return { dates, period, direction };
}

export function FieldError({ message }: { message?: string }) {
  return message ? (
    <AppText variant="label" tone="danger" accessibilityLiveRegion="polite">
      {message}
    </AppText>
  ) : null;
}

export function SelectField({
  label,
  value,
  placeholder,
  error,
  onPress,
}: {
  label: string;
  value?: string;
  placeholder: string;
  error?: string;
  onPress: () => void;
}) {
  return (
    <Stack gap="xs" style={styles.flex}>
      <AppText variant="label" tone="muted">
        {label}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: value || placeholder }}
        onPress={onPress}
        style={({ pressed }) => [
          styles.control,
          error && styles.controlError,
          pressed && styles.controlPressed,
        ]}
      >
        <AppText
          variant="compact"
          tone={value ? 'default' : 'muted'}
          style={styles.flex}
        >
          {value || placeholder}
        </AppText>
        <AppText variant="compact" tone="muted" accessible={false}>
          ⌄
        </AppText>
      </Pressable>
      <FieldError message={error} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screenContent: { flex: 1, padding: 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 56,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: spacing.lg },
  webTabInset: { paddingBottom: 100 },
  footer: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  control: {
    minHeight: theme.compactControlHeight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  controlError: { borderColor: colors.danger },
  controlPressed: { backgroundColor: colors.surfaceSelected },
});
