import { describe, expect, it } from 'vitest';
import { preview, scenarios } from '../../../fixtures/transport/preview';
import { fixtureResponse, trips } from '../../../fixtures/transport/fixture';
describe('transport previews', () => {
  it('opens every mobile scenario including empty and forbidden reads', async () => {
    const screens = await Promise.all(scenarios.map(preview));
    expect(screens.flat()).toContain('200 · 0 đăng ký');
    expect(screens.flat()).toContain(
      '200 · 2026-11-23 · PLANNED · 0 hành khách',
    );
    expect(
      screens.flat().filter((line) => line.startsWith('403 ·')),
    ).toHaveLength(3);
    expect(
      screens
        .flat()
        .some((line) => line.includes('BOARD') && line.includes('ALIGHT')),
    ).toBe(true);
  });
  it('uses the backend problem details format on a denied manifest', () => {
    const path = '/bus-trips/' + trips.completed + '/passengers';
    expect(fixtureResponse('parent-1', path)).toMatchObject({
      status: 403,
      body: {
        title: 'Forbidden',
        status: 403,
        code: 'AUTHORIZATION_ERROR',
        instance: '/api' + path,
        type: 'https://api.guardianway.local/problems/authorization_error',
        detail: expect.any(String),
        traceId: expect.any(String),
        timestamp: expect.any(String),
      },
    });
  });
});
