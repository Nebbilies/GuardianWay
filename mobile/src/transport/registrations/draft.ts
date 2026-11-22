import type { Direction } from '../../../../fixtures/transport/contract';

export const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
export const directionLabels: Record<Direction, string> = {
  PICKUP: 'Chiều đón',
  DROPOFF: 'Chiều trả',
};
export const serviceDirections = ['PICKUP', 'DROPOFF'] as const;

type RequestedPoint = { stopId: string; address: string };

export type RegistrationDraft = {
  studentId: string;
  startDate: string;
  endDate: string;
  weekdays: number[];
  directions: Direction[];
  points: Record<Direction, RequestedPoint>;
};

type RequestedDay = {
  serviceDate: string;
  direction: Direction;
  stopId: string;
  address: string | null;
};

export type DraftErrors = Partial<
  Record<'studentId' | 'period' | 'weekdays' | 'directions' | Direction, string>
>;

export function createDraft(): RegistrationDraft {
  return {
    studentId: '',
    startDate: '',
    endDate: '',
    weekdays: [1, 2, 3, 4, 5],
    directions: [],
    points: {
      PICKUP: { stopId: '', address: '' },
      DROPOFF: { stopId: '', address: '' },
    },
  };
}

export function civilDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function parseCivilDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && civilDate(date) === value
    ? date
    : null;
}

export function formatCivilDate(value: string) {
  return value.split('-').reverse().join('/');
}

export function isoWeekday(date: Date) {
  return date.getUTCDay() || 7;
}

export function prepareDraft(
  draft: RegistrationDraft,
): { ok: true; days: RequestedDay[] } | { ok: false; errors: DraftErrors } {
  const errors: DraftErrors = {};
  const start = parseCivilDate(draft.startDate);
  const end = parseCivilDate(draft.endDate);
  const directions = serviceDirections.filter((direction) =>
    draft.directions.includes(direction),
  );

  if (!draft.studentId) errors.studentId = 'Chọn học sinh.';
  if (!start || !end) errors.period = 'Chọn ngày bắt đầu và ngày kết thúc.';
  else if (start > end)
    errors.period = 'Ngày kết thúc phải từ ngày bắt đầu trở đi.';
  if (
    !draft.weekdays.some((day) => Number.isInteger(day) && day >= 1 && day <= 7)
  ) {
    errors.weekdays = 'Chọn ít nhất một ngày trong tuần.';
  }
  if (!directions.length) errors.directions = 'Chọn ít nhất một chiều.';
  for (const direction of directions) {
    if (!draft.points[direction].stopId) {
      errors[direction] =
        direction === 'PICKUP' ? 'Chọn điểm đón.' : 'Chọn điểm trả.';
    }
  }
  if (!start || !end || Object.keys(errors).length)
    return { ok: false, errors };

  const days: RequestedDay[] = [];
  for (
    const date = start;
    date <= end;
    date.setUTCDate(date.getUTCDate() + 1)
  ) {
    if (!draft.weekdays.includes(isoWeekday(date))) continue;
    for (const direction of directions) {
      const { stopId, address } = draft.points[direction];
      days.push({
        serviceDate: civilDate(date),
        direction,
        stopId,
        address: address.trim() || null,
      });
    }
  }
  return days.length
    ? { ok: true, days }
    : {
        ok: false,
        errors: { period: 'Khoảng ngày không có ngày đi xe đã chọn.' },
      };
}
