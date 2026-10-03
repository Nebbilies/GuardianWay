import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAuthStore } from './auth-store';
import { createApiClient } from './api-client';

vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

function makeSession(accessToken: string, refreshToken: string) {
  return {
    user: {
      id: 'user-1',
      name: 'Parent',
      email: 'parent@example.com',
      role: 'PARENT' as const,
      schoolId: 'school-1',
    },
    session: {
      tokenType: 'Bearer' as const,
      accessToken,
      refreshToken,
      accessTokenExpiresIn: 900,
      refreshTokenExpiresIn: 604800,
    },
  };
}

function response(status: number) {
  return { status, ok: status >= 200 && status < 300 } as Response;
}

function setup(fetchImpl: typeof fetch) {
  const api = {
    login: vi.fn().mockResolvedValue(makeSession('access-old', 'refresh-old')),
    refresh: vi.fn().mockResolvedValue(makeSession('access-new', 'refresh-new')),
    logout: vi.fn().mockResolvedValue(undefined),
    me: vi.fn(),
  };
  const storage = {
    getRefreshToken: vi.fn().mockResolvedValue(null),
    setRefreshToken: vi.fn().mockResolvedValue(undefined),
    clearRefreshToken: vi.fn().mockResolvedValue(undefined),
  };
  const store = createAuthStore({ api, storage } as never);
  store.setState({ status: 'signedOut' });
  const client = createApiClient({ store, fetchImpl });
  return { api, client, store };
}

describe('authenticated API client', () => {
  beforeEach(() => {
    vi.stubEnv('EXPO_PUBLIC_API_URL', 'http://localhost:8000');
  });

  it('refreshes once after 401 and retries with the new access token', async () => {
    const fetchImpl = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(response(401))
      .mockResolvedValueOnce(response(200));
    const { api, client, store } = setup(fetchImpl);
    await store.getState().signIn('parent@example.com', 'password');

    const result = await client('/api/students');

    expect(result.status).toBe(200);
    expect(api.refresh).toHaveBeenCalledOnce();
    expect(fetchImpl.mock.calls.map((call) => new Headers(call[1]?.headers).get('Authorization')))
      .toEqual(['Bearer access-old', 'Bearer access-new']);
  });

  it('shares refresh across concurrent unauthorized requests', async () => {
    const fetchImpl = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(response(401))
      .mockResolvedValueOnce(response(401))
      .mockResolvedValueOnce(response(200))
      .mockResolvedValueOnce(response(200));
    const { api, client, store } = setup(fetchImpl);
    await store.getState().signIn('parent@example.com', 'password');

    const [first, second] = await Promise.all([
      client('/api/students'),
      client('/api/buses'),
    ]);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(api.refresh).toHaveBeenCalledOnce();
    expect(fetchImpl).toHaveBeenCalledTimes(4);
  });

  it('does not retry the original request more than once', async () => {
    const fetchImpl = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(response(401))
      .mockResolvedValueOnce(response(401));
    const { api, client, store } = setup(fetchImpl);
    await store.getState().signIn('parent@example.com', 'password');

    const result = await client('/api/students');

    expect(result.status).toBe(401);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(api.refresh).toHaveBeenCalledOnce();
    expect(api.logout).toHaveBeenCalledWith('refresh-new');
    expect(store.getState().status).toBe('signedOut');
  });
});
