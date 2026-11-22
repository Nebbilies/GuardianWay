import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/app-text';
import { Stack } from '@/components/stack';
import { Alert, Button, Card, EmptyState, TextField } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';

import type { Direction } from '../../../../fixtures/transport/contract';
import {
  createDraft,
  directionLabels,
  formatCivilDate,
  serviceDirections,
  weekdays,
  type DraftErrors,
} from './draft';
import { DateRangeSheet, OptionSheet } from './picker-sheet';
import { useRegistrationSession } from './registration-provider';
import {
  FieldError,
  RegistrationLoadState,
  RegistrationPage,
  SelectField,
} from './registration-ui';
import type { RegistrationSession } from './session';

type Picker = 'student' | 'startDate' | 'endDate' | Direction;

const pointLabels: Record<Direction, string> = {
  PICKUP: 'Điểm đón',
  DROPOFF: 'Điểm trả',
};

function returnToList() {
  router.dismissTo('/registrations');
}

export function RegistrationFormScreen() {
  const state = useRegistrationSession();
  if (state && 'ready' in state && state.ready.students.length) {
    return <RegistrationForm session={state.ready} />;
  }

  return (
    <RegistrationPage title="Tạo đăng ký" onBack={returnToList}>
      {state && 'ready' in state ? (
        <Card>
          <EmptyState
            title="Chưa có học sinh có quyền đăng ký"
            description="Liên hệ nhà trường để kiểm tra quyền đăng ký xe cho học sinh."
            action={
              <Button variant="secondary" onPress={returnToList}>
                Về danh sách
              </Button>
            }
          />
        </Card>
      ) : (
        <RegistrationLoadState error={state?.error} />
      )}
    </RegistrationPage>
  );
}

function RegistrationForm({ session }: { session: RegistrationSession }) {
  const [draft, setDraft] = useState(createDraft);
  const [errors, setErrors] = useState<DraftErrors>({});
  const [submitError, setSubmitError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [picker, setPicker] = useState<Picker>();
  const inFlight = useRef(false);

  const selectedStudent = session.students.find(
    (student) => student.id === draft.studentId,
  );
  const startDate = draft.startDate
    ? formatCivilDate(draft.startDate)
    : undefined;
  const endDate = draft.endDate ? formatCivilDate(draft.endDate) : undefined;

  function open(value: Picker) {
    Keyboard.dismiss();
    setPicker(value);
  }

  function close() {
    setPicker(undefined);
  }

  function toggleWeekday(day: number) {
    setDraft((current) => ({
      ...current,
      weekdays: current.weekdays.includes(day)
        ? current.weekdays.filter((value) => value !== day)
        : [...current.weekdays, day],
    }));
    setErrors((current) => ({
      ...current,
      weekdays: undefined,
      period: undefined,
    }));
  }

  function toggleDirection(direction: Direction) {
    setDraft((current) => ({
      ...current,
      directions: current.directions.includes(direction)
        ? current.directions.filter((value) => value !== direction)
        : [...current.directions, direction],
    }));
    setErrors((current) => ({
      ...current,
      directions: undefined,
      [direction]: undefined,
    }));
  }

  function changePoint(
    direction: Direction,
    value: { stopId?: string; address?: string },
  ) {
    setDraft((current) => ({
      ...current,
      points: {
        ...current.points,
        [direction]: { ...current.points[direction], ...value },
      },
    }));
    if (value.stopId)
      setErrors((current) => ({ ...current, [direction]: undefined }));
  }

  async function submit() {
    if (inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    setSubmitError(undefined);
    Keyboard.dismiss();
    let completed = false;
    try {
      const result = await session.submit(draft);
      if (result.status === 'invalid') setErrors(result.errors);
      if (result.status === 'failed') {
        setErrors({});
        setSubmitError(result.message);
      }
      if (result.status === 'submitted') {
        completed = true;
        router.dismissTo({
          pathname: '/registrations',
          params: { submitted: result.registration.id },
        });
      }
    } finally {
      if (!completed) {
        inFlight.current = false;
        setSubmitting(false);
      }
    }
  }

  const footer = (
    <Stack gap="sm">
      {submitError ? (
        <Alert severity="danger" title="Chưa gửi được đăng ký">
          {submitError}
        </Alert>
      ) : null}
      <Button fullWidth loading={submitting} onPress={() => void submit()}>
        {submitError ? 'Thử gửi lại' : 'Gửi đăng ký'}
      </Button>
    </Stack>
  );

  return (
    <RegistrationPage title="Tạo đăng ký" onBack={returnToList} footer={footer}>
      <SelectField
        label="Học sinh"
        value={selectedStudent?.name}
        placeholder="Chọn học sinh"
        error={errors.studentId}
        onPress={() => open('student')}
      />
      <Stack gap="sm">
        <AppText variant="componentTitle" accessibilityRole="header">
          Kỳ đăng ký
        </AppText>
        <Stack direction="row" gap="sm">
          <SelectField
            label="Ngày bắt đầu"
            value={startDate}
            placeholder="Chọn ngày"
            onPress={() => open('startDate')}
          />
          <SelectField
            label="Ngày kết thúc"
            value={endDate}
            placeholder="Chọn ngày"
            onPress={() => open('endDate')}
          />
        </Stack>
        <FieldError message={errors.period} />
        <AppText variant="label" tone="muted">
          Các ngày đi xe
        </AppText>
        <Stack direction="row" wrap gap="xs">
          {weekdays.map((label, index) => {
            const day = index + 1;
            return (
              <Choice
                key={label}
                title={label}
                accessibilityLabel={day === 7 ? 'Chủ nhật' : 'Thứ ' + (day + 1)}
                selected={draft.weekdays.includes(day)}
                onPress={() => toggleWeekday(day)}
              />
            );
          })}
        </Stack>
        <FieldError message={errors.weekdays} />
      </Stack>
      <Stack gap="sm">
        <AppText variant="label" tone="muted">
          Chiều đăng ký
        </AppText>
        <Stack direction="row" gap="sm">
          {serviceDirections.map((direction) => (
            <Choice
              key={direction}
              title={directionLabels[direction]}
              equalWidth
              selected={draft.directions.includes(direction)}
              onPress={() => toggleDirection(direction)}
            />
          ))}
        </Stack>
        <FieldError message={errors.directions} />
      </Stack>
      {serviceDirections
        .filter((direction) => draft.directions.includes(direction))
        .map((direction) => {
          const point = draft.points[direction];
          const name = session
            .pointsFor(direction)
            .find((stop) => stop.id === point.stopId)?.name;
          const label = pointLabels[direction];
          return (
            <Stack key={direction} gap="sm">
              <SelectField
                label={label}
                value={name}
                placeholder={
                  direction === 'PICKUP' ? 'Chọn điểm đón' : 'Chọn điểm trả'
                }
                error={errors[direction]}
                onPress={() => open(direction)}
              />
              <TextField
                label={
                  'Địa chỉ bổ sung ' + directionLabels[direction].toLowerCase()
                }
                optional
                placeholder={
                  direction === 'PICKUP'
                    ? 'Nhập địa chỉ gần điểm đón'
                    : 'Nhập địa chỉ gần điểm trả'
                }
                value={point.address}
                onChangeText={(address) => changePoint(direction, { address })}
              />
            </Stack>
          );
        })}
      {picker === 'student' ? (
        <OptionSheet
          title="Chọn học sinh"
          options={session.students.map((student) => ({
            id: student.id,
            title: student.name,
            description: student.code,
          }))}
          selectedId={draft.studentId}
          onSelect={(id) => {
            setDraft((current) => ({ ...current, studentId: id }));
            setErrors((current) => ({ ...current, studentId: undefined }));
            close();
          }}
          onClose={close}
        />
      ) : null}
      {picker === 'startDate' || picker === 'endDate' ? (
        <DateRangeSheet
          field={picker}
          initial={{ startDate: draft.startDate, endDate: draft.endDate }}
          onApply={(range) => {
            setDraft((current) => ({ ...current, ...range }));
            setErrors((current) => ({ ...current, period: undefined }));
            close();
          }}
          onClose={close}
        />
      ) : null}
      {picker === 'PICKUP' || picker === 'DROPOFF' ? (
        <OptionSheet
          title={picker === 'PICKUP' ? 'Chọn điểm đón' : 'Chọn điểm trả'}
          options={session.pointsFor(picker).map((point) => ({
            id: point.id,
            title: point.name,
            description: point.address,
          }))}
          selectedId={draft.points[picker].stopId}
          onSelect={(stopId) => {
            changePoint(picker, { stopId });
            close();
          }}
          onClose={close}
        />
      ) : null}
    </RegistrationPage>
  );
}

function Choice({
  title,
  accessibilityLabel = title,
  equalWidth = false,
  selected,
  onPress,
}: {
  title: string;
  accessibilityLabel?: string;
  equalWidth?: boolean;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[
        styles.choice,
        equalWidth && styles.equalWidth,
        selected && styles.selected,
      ]}
    >
      <AppText
        variant="compact"
        tone={selected ? 'default' : 'muted'}
        style={styles.choiceLabel}
      >
        {selected ? '✓ ' : ''}
        {title}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  choice: {
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  equalWidth: { flex: 1 },
  choiceLabel: { textAlign: 'center' },
  selected: {
    backgroundColor: colors.surfaceSelected,
    borderColor: colors.accent,
  },
});
