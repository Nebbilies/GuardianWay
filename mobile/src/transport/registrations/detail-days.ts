import type {
  Direction,
  Registration,
} from '../../../../fixtures/transport/contract';

type StopGroup = {
  requested?: string;
  approved?: string;
  dates: Set<string>;
};

export function groupRegistrationStops(
  days: Registration['days'],
  direction: Direction,
  totalDates: number,
) {
  const groups = new Map<string, StopGroup>();
  for (const day of days) {
    if (day.direction !== direction) continue;
    const key = JSON.stringify([day.requestedStop?.id, day.approvedStop?.id]);
    const existing = groups.get(key);
    if (existing) existing.dates.add(day.serviceDate);
    else
      groups.set(key, {
        requested: day.requestedStop?.name,
        approved: day.approvedStop?.name,
        dates: new Set([day.serviceDate]),
      });
  }
  return Array.from(groups, ([key, { requested, approved, dates }]) => ({
    key,
    requested,
    approved,
    displayDates: dates.size === totalDates ? [] : [...dates].sort(),
  }));
}
