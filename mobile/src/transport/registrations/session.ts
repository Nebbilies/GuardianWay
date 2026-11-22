import type {
  Direction,
  Registration,
} from '../../../../fixtures/transport/contract';
import demo from '../../../../fixtures/transport/demo.json';
import { fixtureClient } from '../../../../fixtures/transport/fixture';

import type { AuthUser } from '../../auth/auth-contract';
import {
  prepareDraft,
  type DraftErrors,
  type RegistrationDraft,
} from './draft';

type SubmitResult =
  | { status: 'invalid'; errors: DraftErrors }
  | { status: 'failed'; message: string }
  | { status: 'busy' }
  | { status: 'submitted'; registration: Registration };

type RegistrationIdentity = Pick<AuthUser, 'role' | 'schoolId' | 'email'>;
let nextSession = 0;

function recordActor(user: RegistrationIdentity) {
  const { schoolId, role } = user;
  if (role !== 'PARENT' || !schoolId) return undefined;
  const email = user.email.trim().toLowerCase();
  return Object.entries(demo.registrationForm.studentsByActor).find(
    ([actor]) => email === `${actor}.${schoolId.toLowerCase()}@demo.invalid`,
  );
}

async function readRegistrations(actor: string | undefined) {
  if (!actor || !Object.hasOwn(demo.guardians, actor)) return [];
  const client = fixtureClient(actor as keyof typeof demo.guardians);
  const rows: Registration[] = [];
  let page: number | null = 1;
  while (page !== null) {
    const result = await client.registrations(page, 100);
    rows.push(...result.data);
    page = result.metadata.nextPage;
  }
  return rows.sort(
    (a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt),
  );
}

export async function loadRegistrationSession(
  user: RegistrationIdentity,
  { failOnce = false, now = () => new Date() } = {},
) {
  const [actor, students = []] = recordActor(user) ?? [];
  const points = actor ? demo.registrationForm.points : [];
  const schoolName = actor ? demo.registrationForm.schoolName : null;
  const listeners = new Set<() => void>();
  let rows = await readRegistrations(actor);
  let sending = false;
  let failNext = failOnce;
  let sequence = 0;
  const sessionId = `${Date.now().toString(36)}-${++nextSession}`;

  function pointsFor(direction: Direction) {
    return points.filter((point) =>
      direction === 'PICKUP' ? point.allowsPickup : point.allowsDropoff,
    );
  }

  async function submit(draft: RegistrationDraft): Promise<SubmitResult> {
    if (sending) return { status: 'busy' };
    const prepared = prepareDraft(draft);
    if (!prepared.ok) return { status: 'invalid', errors: prepared.errors };

    const student = students.find((entry) => entry.id === draft.studentId);
    if (!student)
      return {
        status: 'invalid',
        errors: {
          studentId: 'Bạn không có quyền đăng ký xe cho học sinh này.',
        },
      };

    const days: (Registration['days'][number] & {
      requestedAddress: string | null;
    })[] = [];
    for (const day of prepared.days) {
      const point = pointsFor(day.direction).find(
        (entry) => entry.id === day.stopId,
      );
      if (!point)
        return {
          status: 'invalid',
          errors: {
            [day.direction]: 'Chọn điểm phục vụ phù hợp với chiều này.',
          },
        };
      const { id, code, name } = point;
      days.push({
        serviceDate: day.serviceDate,
        direction: day.direction,
        requestedStop: { id, code, name },
        requestedAddress: day.address,
        approvedStop: null,
      });
    }

    sending = true;
    try {
      await Promise.resolve();
      if (failNext) {
        failNext = false;
        return {
          status: 'failed',
          message: 'Kiểm tra kết nối rồi thử lại. Thông tin đã nhập vẫn còn.',
        };
      }

      const registration: Registration = {
        id: `local-${sessionId}-${++sequence}`,
        student,
        status: 'PENDING',
        reviewNote: null,
        submittedAt: now().toISOString(),
        days,
      };
      rows = [registration, ...rows];
      listeners.forEach((listener) => listener());
      return { status: 'submitted', registration };
    } finally {
      sending = false;
    }
  }

  return {
    schoolName,
    students,
    pointsFor,
    getSnapshot: (): readonly Registration[] => rows,
    find: (id: string) => rows.find((row) => row.id === id),
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    submit,
  };
}

export type RegistrationSession = Awaited<
  ReturnType<typeof loadRegistrationSession>
>;
