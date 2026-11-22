import { describe, expect, it } from 'vitest';

import type { Registration } from '../../../../fixtures/transport/contract';
import { groupRegistrationStops } from './detail-days';

function day(
  serviceDate: string,
  direction: Registration['days'][number]['direction'],
) {
  return { serviceDate, direction, requestedStop: null, approvedStop: null };
}

describe('registration detail dates', () => {
  it('shows separate dates when each direction has one stop group on different days', () => {
    const days = [day('2026-11-23', 'PICKUP'), day('2026-11-24', 'DROPOFF')];

    expect(groupRegistrationStops(days, 'PICKUP', 2)).toMatchObject([
      { displayDates: ['2026-11-23'] },
    ]);
    expect(groupRegistrationStops(days, 'DROPOFF', 2)).toMatchObject([
      { displayDates: ['2026-11-24'] },
    ]);
  });

  it('omits repeated date labels when both directions cover the full schedule', () => {
    const days = [
      day('2026-11-23', 'PICKUP'),
      day('2026-11-24', 'PICKUP'),
      day('2026-11-23', 'DROPOFF'),
      day('2026-11-24', 'DROPOFF'),
    ];

    expect(groupRegistrationStops(days, 'PICKUP', 2)).toMatchObject([
      { displayDates: [] },
    ]);
    expect(groupRegistrationStops(days, 'DROPOFF', 2)).toMatchObject([
      { displayDates: [] },
    ]);
  });
});
