import { createRequire } from 'node:module';
import { afterEach, expect, it, vi } from 'vitest';
import { authApi } from '../../src/auth/auth-api';
import {
  decodeAuthSession,
  decodeCurrentUser,
  decodeLogout,
  decodeErrorMessage,
} from '../../src/auth/auth-contract';
type Case = {
  id: string;
  request: { path: string; method: string; body?: Record<string, string> };
  response: { status: number; body: unknown };
};
const requireFromTest = createRequire(import.meta.url);
const { loadCases, consumed } = requireFromTest(
  '../../../scripts/contract-cases.cjs',
) as {
  loadCases: () => { cases: Case[] };
  consumed: (app: string, ids: string[]) => void;
};
const ids = [
  'auth.mobile.login',
  'auth.mobile.refresh',
  'auth.mobile.logout',
  'auth.me',
  'problem.credentials',
];
const records = loadCases().cases.filter((record) => ids.includes(record.id));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it('keeps mobile auth compatible with real backend response shapes and accepted request bodies', async () => {
  vi.stubEnv('EXPO_PUBLIC_API_URL', 'http://provider.test');
  for (const record of records) {
    if (record.id === 'problem.credentials') {
      expect(decodeErrorMessage(record.response.body)).toBe(
        'Invalid email or password',
      );
      continue;
    }
    const fetch = vi.fn(
      async () =>
        new Response(JSON.stringify(record.response.body), {
          status: record.response.status,
        }),
    );
    vi.stubGlobal('fetch', fetch);
    let result: unknown, expected: unknown;
    switch (record.id) {
      case 'auth.mobile.login':
        result = await authApi.login(
          record.request.body!.email!,
          record.request.body!.password!,
        );
        expected = decodeAuthSession(record.response.body);
        break;
      case 'auth.mobile.refresh':
        result = await authApi.refresh(record.request.body!.refreshToken!);
        expected = decodeAuthSession(record.response.body);
        break;
      case 'auth.mobile.logout':
        result = await authApi.logout(record.request.body!.refreshToken!);
        expected = decodeLogout(record.response.body);
        break;
      case 'auth.me':
        result = await authApi.me('opaque-access-token');
        expected = decodeCurrentUser(record.response.body);
        break;
    }
    expect(result).toEqual(expected);
    expect(fetch).toHaveBeenCalledOnce();
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(new URL(url).pathname).toBe(record.request.path);
    expect(init.method ?? 'GET').toBe(record.request.method);
    expect(init.body ? JSON.parse(String(init.body)) : undefined).toEqual(
      record.request.body,
    );
    if (record.id === 'auth.me')
      expect(init.headers).toEqual({
        Authorization: 'Bearer opaque-access-token',
      });
  }
  consumed('mobile', ids);
});
it('rejects incomplete sessions and invalid roles or token lifetimes', () => {
  const body = records.find((record) => record.id === 'auth.mobile.login')!
    .response.body as {
    user: Record<string, unknown>;
    session: Record<string, unknown>;
  };
  expect(() => decodeAuthSession({ user: body.user })).toThrow();
  expect(() =>
    decodeAuthSession({ ...body, user: { ...body.user, role: 'UNKNOWN' } }),
  ).toThrow();
  expect(() =>
    decodeAuthSession({
      ...body,
      session: { ...body.session, accessTokenExpiresIn: 0 },
    }),
  ).toThrow();
  expect(() =>
    decodeAuthSession({ ...body, user: { ...body.user, schoolId: null } }),
  ).toThrow();
});
