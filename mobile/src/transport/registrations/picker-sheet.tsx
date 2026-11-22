import { useState, type ReactNode } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Stack } from '@/components/stack';
import { Button } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';

import {
  civilDate,
  formatCivilDate,
  isoWeekday,
  parseCivilDate,
  weekdays,
} from './draft';

function PickerSheet({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { height } = useWindowDimensions();
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          accessible={false}
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView
          edges={['bottom', 'left', 'right']}
          style={[styles.sheet, { maxHeight: height * 0.92 }]}
          accessibilityViewIsModal
        >
          <View style={styles.grip} />
          <Stack
            direction="row"
            align="center"
            justify="space-between"
            style={styles.sheetHeader}
          >
            <AppText
              variant="sectionTitle"
              accessibilityRole="header"
              style={styles.flex}
            >
              {title}
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Đóng"
              onPress={onClose}
              style={styles.iconButton}
            >
              <AppText variant="componentTitle">×</AppText>
            </Pressable>
          </Stack>
          <ScrollView
            automaticallyAdjustContentInsets={false}
            keyboardShouldPersistTaps="handled"
          >
            <Stack gap="sm" style={styles.sheetContent}>
              {children}
            </Stack>
          </ScrollView>
          {footer ? <View style={styles.sheetFooter}>{footer}</View> : null}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

export function OptionSheet({
  title,
  options,
  selectedId,
  onSelect,
  onClose,
}: {
  title: string;
  options: readonly { id: string; title: string; description?: string }[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <PickerSheet title={title} onClose={onClose}>
      {options.length ? (
        options.map((option) => {
          const selected = option.id === selectedId;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => onSelect(option.id)}
              style={[styles.option, selected && styles.selected]}
            >
              <AppText
                variant="compact"
                tone={selected ? 'default' : 'muted'}
                accessible={false}
              >
                {selected ? '✓' : '○'}
              </AppText>
              <Stack style={styles.flex} gap="xs">
                <AppText variant="compact">{option.title}</AppText>
                {option.description ? (
                  <AppText variant="label" tone="muted">
                    {option.description}
                  </AppText>
                ) : null}
              </Stack>
            </Pressable>
          );
        })
      ) : (
        <AppText tone="muted">Chưa có điểm phục vụ phù hợp.</AppText>
      )}
    </PickerSheet>
  );
}

type DateRange = { startDate: string; endDate: string };
type RangeField = keyof DateRange;

function initialMonth(range: DateRange, field: RangeField) {
  const date =
    parseCivilDate(range[field]) ??
    parseCivilDate(range.startDate) ??
    new Date();
  const first = new Date(date);
  first.setUTCDate(1);
  return civilDate(first);
}

function monthCells(month: Date) {
  const next = new Date(month);
  next.setUTCMonth(next.getUTCMonth() + 1, 0);
  const leading = isoWeekday(month) - 1;
  const total = Math.ceil((leading + next.getUTCDate()) / 7) * 7;
  return Array.from({ length: total }, (_, index) => {
    const day = index - leading + 1;
    if (day < 1 || day > next.getUTCDate()) return null;
    const date = new Date(month);
    date.setUTCDate(day);
    return { day, key: civilDate(date) };
  });
}

export function DateRangeSheet({
  initial,
  field,
  onApply,
  onClose,
}: {
  initial: DateRange;
  field: RangeField;
  onApply: (range: DateRange) => void;
  onClose: () => void;
}) {
  const [range, setRange] = useState(initial);
  const [active, setActive] = useState<RangeField>(
    initial.startDate ? field : 'startDate',
  );
  const [monthKey, setMonthKey] = useState(() => initialMonth(initial, field));
  const month = parseCivilDate(monthKey)!;
  const year = month.getUTCFullYear();
  const monthNumber = month.getUTCMonth();
  const cells = monthCells(month);
  const { width } = useWindowDimensions();
  const narrowCalendar = width < 364;

  function changeMonth(offset: number) {
    const changed = new Date(month);
    changed.setUTCMonth(monthNumber + offset);
    if (changed.getUTCFullYear() >= 0 && changed.getUTCFullYear() <= 9999)
      setMonthKey(civilDate(changed));
  }

  function select(value: string) {
    if (active === 'startDate' || !range.startDate || value < range.startDate) {
      setRange({
        startDate: value,
        endDate:
          active === 'startDate' && range.endDate >= value ? range.endDate : '',
      });
      setActive('endDate');
    } else {
      setRange({ ...range, endDate: value });
    }
  }

  return (
    <PickerSheet
      title="Chọn khoảng ngày"
      onClose={onClose}
      footer={
        <Button
          fullWidth
          disabled={!range.startDate || !range.endDate}
          onPress={() => onApply(range)}
        >
          Áp dụng
        </Button>
      }
    >
      <Stack direction="row" gap="sm">
        {(
          [
            ['startDate', 'Ngày bắt đầu'],
            ['endDate', 'Ngày kết thúc'],
          ] as const
        ).map(([key, label]) => (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityLabel={label + ' trong lịch'}
            accessibilityState={{ selected: active === key }}
            onPress={() => {
              setActive(key);
              if (range[key]) setMonthKey(range[key].slice(0, 7) + '-01');
            }}
            style={[styles.rangeField, active === key && styles.selected]}
          >
            <AppText variant="label" tone="muted">
              {label}
            </AppText>
            <AppText variant="compact">
              {range[key] ? formatCivilDate(range[key]) : 'Chọn ngày'}
            </AppText>
          </Pressable>
        ))}
      </Stack>
      <Stack direction="row" align="center" justify="space-between">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tháng trước"
          onPress={() => changeMonth(-1)}
          style={styles.iconButton}
        >
          <AppText variant="sectionTitle">‹</AppText>
        </Pressable>
        <AppText variant="compact" accessibilityLiveRegion="polite">
          {'Tháng ' + (monthNumber + 1) + ', ' + year}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tháng sau"
          onPress={() => changeMonth(1)}
          style={styles.iconButton}
        >
          <AppText variant="sectionTitle">›</AppText>
        </Pressable>
      </Stack>
      <View style={narrowCalendar && styles.narrowCalendar}>
        <Stack
          direction="row"
          gap="xs"
          style={narrowCalendar && styles.tightWeek}
        >
          {weekdays.map((day) => (
            <AppText
              key={day}
              variant="label"
              tone="muted"
              style={styles.dayLabel}
            >
              {day}
            </AppText>
          ))}
        </Stack>
        {Array.from({ length: cells.length / 7 }, (_, row) => (
          <Stack
            key={row}
            direction="row"
            gap="xs"
            style={narrowCalendar && styles.tightWeek}
          >
            {cells.slice(row * 7, row * 7 + 7).map((cell, column) => {
              if (!cell) return <View key={column} style={styles.dayCell} />;
              const endpoint =
                cell.key === range.startDate || cell.key === range.endDate;
              const inRange =
                cell.key > range.startDate && cell.key < range.endDate;
              return (
                <Pressable
                  key={cell.key}
                  accessibilityRole="button"
                  accessibilityLabel={formatCivilDate(cell.key)}
                  accessibilityState={{ selected: endpoint || inRange }}
                  onPress={() => select(cell.key)}
                  style={[
                    styles.dayCell,
                    endpoint ? styles.endpoint : inRange && styles.inRange,
                  ]}
                >
                  <AppText
                    variant="compact"
                    tone={endpoint ? 'inverse' : 'default'}
                  >
                    {cell.day}
                  </AppText>
                </Pressable>
              );
            })}
          </Stack>
        ))}
      </View>
    </PickerSheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.sm,
    overflow: 'hidden',
  },
  grip: {
    backgroundColor: colors.border,
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  sheetHeader: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  sheetContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  sheetFooter: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  iconButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  option: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    minHeight: 56,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  rangeField: {
    flex: 1,
    minHeight: 50,
    justifyContent: 'center',
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
  },
  selected: {
    backgroundColor: colors.surfaceSelected,
    borderColor: colors.accent,
  },
  dayLabel: { flex: 1, textAlign: 'center' },
  dayCell: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  endpoint: { backgroundColor: colors.primary },
  inRange: { backgroundColor: colors.surfaceSelected },
  narrowCalendar: { marginHorizontal: -spacing.md },
  tightWeek: { gap: 0 },
});
