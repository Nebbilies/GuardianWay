import { describe, expect, it } from 'vitest';

import type { AuthUser } from '../../auth/auth-contract';
import { createDraft } from './draft';
import { loadRegistrationSession } from './session';

const schoolId = 'f9e07530-f0e4-4836-8ae5-b06d8133d988';

function parent(actor: string): AuthUser {
  return {
    id: actor,
    name: 'Demo',
    schoolId,
    email: `${actor}.${schoolId}@demo.invalid`,
    role: 'PARENT',
  };
}

async function start(failOnce = false) {
  const session = await loadRegistrationSession(parent('parent-1'), {
    failOnce,
    now: () => new Date('2030-01-01T00:00:00.000Z'),
  });
  const draft = {
    ...createDraft(),
    studentId: session.students[0]!.id,
    startDate: '2030-01-07',
    endDate: '2030-01-07',
    directions: ['PICKUP' as const],
    points: {
      PICKUP: {
        stopId: session.pointsFor('PICKUP')[0]!.id,
        address: 'Bên trái cổng',
      },
      DROPOFF: { stopId: '', address: '' },
    },
  };
  return { session, draft };
}

describe('dev registration session', () => {
  it('uses parent and school identity for reads and checks request rights separately', async () => {
    const eligible = await loadRegistrationSession(parent('parent-1'));
    const trackOnly = await loadRegistrationSession(parent('parent-4'));
    const unrelated = await loadRegistrationSession({
      ...parent('parent-1'),
      schoolId: 'other-school',
    });
    const driver = await loadRegistrationSession({
      ...parent('parent-1'),
      role: 'DRIVER',
    });

    expect(eligible.students.map((student) => student.code)).toEqual([
      'HS01',
      'HS02',
    ]);
    expect(eligible.getSnapshot().map((row) => row.student.code)).toEqual([
      'HS01',
      'HS02',
    ]);
    expect(trackOnly.students).toEqual([]);
    expect(unrelated.getSnapshot()).toEqual([]);
    expect(driver.getSnapshot()).toEqual([]);
  });

  it('shows only service points for the selected direction and rejects a mismatched point', async () => {
    const { session, draft } = await start();
    const dropoffOnly = session
      .pointsFor('DROPOFF')
      .find((point) => point.code === 'CV');
    expect(dropoffOnly).toBeDefined();
    expect(session.pointsFor('PICKUP').map((point) => point.code)).toEqual([
      'BEN',
    ]);
    draft.points.PICKUP.stopId = dropoffOnly!.id;
    await expect(session.submit(draft)).resolves.toMatchObject({
      status: 'invalid',
      errors: { PICKUP: expect.any(String) },
    });
  });

  it('keeps the draft on failure and publishes a single newest pending request after retry', async () => {
    const { session, draft } = await start(true);
    const before = session.getSnapshot();
    const originalDraft = structuredClone(draft);

    await expect(session.submit(draft)).resolves.toMatchObject({
      status: 'failed',
      message: expect.any(String),
    });
    expect(session.getSnapshot()).toEqual(before);
    expect(draft).toEqual(originalDraft);

    const results = await Promise.all([
      session.submit(draft),
      session.submit(draft),
    ]);
    expect(results.map((result) => result.status)).toEqual([
      'submitted',
      'busy',
    ]);
    expect(session.getSnapshot()).toHaveLength(before.length + 1);
    expect(session.getSnapshot()[0]).toMatchObject({
      status: 'PENDING',
      reviewNote: null,
      days: [
        {
          serviceDate: '2030-01-07',
          direction: 'PICKUP',
          requestedStop: { code: 'BEN' },
          requestedAddress: 'Bên trái cổng',
          approvedStop: null,
        },
      ],
    });
  });

  it('keeps new requests private to the current instance and rejects other children', async () => {
    const { session, draft } = await start();
    const other = await loadRegistrationSession(parent('parent-2'));
    const foreign = await session.submit({
      ...draft,
      studentId: other.students[0]!.id,
    });
    expect(foreign).toMatchObject({
      status: 'invalid',
      errors: { studentId: expect.any(String) },
    });

    const result = await session.submit(draft);
    expect(result.status).toBe('submitted');
    if (result.status !== 'submitted') return;
    const fresh = await loadRegistrationSession(parent('parent-1'));
    expect(session.find(result.registration.id)).toEqual(result.registration);
    expect(other.find(result.registration.id)).toBeUndefined();
    expect(fresh.find(result.registration.id)).toBeUndefined();
  });
});
