import { describe, expect, it } from 'vitest';

import { createDraft, prepareDraft, type RegistrationDraft } from './draft';

const valid: RegistrationDraft = {
  ...createDraft(),
  studentId: 'student',
  startDate: '2028-02-28',
  endDate: '2028-03-01',
  directions: ['PICKUP'],
  points: {
    PICKUP: { stopId: 'pickup', address: '' },
    DROPOFF: { stopId: 'dropoff', address: ' Gần cổng ' },
  },
};

describe('registration form dates', () => {
  it('defaults to weekdays and includes both boundaries across leap day', () => {
    expect(createDraft().weekdays).toEqual([1, 2, 3, 4, 5]);
    const result = prepareDraft(valid);
    expect(result.ok && result.days.map((day) => day.serviceDate)).toEqual([
      '2028-02-28',
      '2028-02-29',
      '2028-03-01',
    ]);
  });

  it('uses each direction’s point and optional address on selected weekends', () => {
    expect(
      prepareDraft({
        ...valid,
        startDate: '2028-03-04',
        endDate: '2028-03-05',
        weekdays: [6, 7],
        directions: ['PICKUP', 'DROPOFF'],
      }),
    ).toEqual({
      ok: true,
      days: [
        {
          serviceDate: '2028-03-04',
          direction: 'PICKUP',
          stopId: 'pickup',
          address: null,
        },
        {
          serviceDate: '2028-03-04',
          direction: 'DROPOFF',
          stopId: 'dropoff',
          address: 'Gần cổng',
        },
        {
          serviceDate: '2028-03-05',
          direction: 'PICKUP',
          stopId: 'pickup',
          address: null,
        },
        {
          serviceDate: '2028-03-05',
          direction: 'DROPOFF',
          stopId: 'dropoff',
          address: 'Gần cổng',
        },
      ],
    });
  });

  it('rejects invalid, reversed, and unmatched periods', () => {
    for (const dates of [
      { startDate: '2027-02-29' },
      { endDate: '2028-02-27' },
      { weekdays: [6, 7] },
    ]) {
      expect(prepareDraft({ ...valid, ...dates })).toMatchObject({
        ok: false,
        errors: { period: expect.any(String) },
      });
    }
  });

  it('reports required input before constructing any service days', () => {
    expect(prepareDraft(createDraft())).toMatchObject({
      ok: false,
      errors: {
        studentId: expect.any(String),
        period: expect.any(String),
        directions: expect.any(String),
      },
    });
  });
});
