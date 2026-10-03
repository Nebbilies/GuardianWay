import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAuthStore } from './auth-store';

vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

function makeSession(role: 'DRIVER' | 'PARENT' | 'ADMIN' = 'PARENT', suffix = 'next') {
  return {
    user: {
      id: 'user-1',
      name: 'Guardian User',
      email: 'guardian@example.com',
      role,
      schoolId: 'school-1',
    },
    session: {
      tokenType: 'Bearer' as const,
      accessToken: `access-${suffix}`,
      refreshToken: `refresh-${suffix}`,
      accessTokenExpiresIn: 900,
      refreshTokenExpiresIn: 604800,
    },
  };
}

function setup() {
  const storage = {
    getRefreshToken: vi.fn<() => Promise<string | null>>().mockResolvedValue(null),
    setRefreshToken: vi.fn<(token: string) => Promise<void>>().mockResolvedValue(undefined),
    clearRefreshToken: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
  };
  const api = {
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
    me: vi.fn(),
  };
  const store = createAuthStore({ storage, api } as never);
  store.setState({ status: 'signedOut' });
  return { api, storage, store };
}

describe('auth store', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('stores the refresh token and keeps access token in the active session', async () => {
    const { api, storage, store } = setup();
    api.login.mockResolvedValue(makeSession('DRIVER', 'login'));

    await store.getState().signIn('driver@example.com', 'password');

    expect(storage.setRefreshToken).toHaveBeenCalledWith('refresh-login');
    expect(store.getState()).toMatchObject({
      status: 'signedIn',
      accessToken: 'access-login',
      refreshToken: 'refresh-login',
      user: { role: 'DRIVER' },
    });
  });

  it('rotates stored refresh token before hydrating the current user', async () => {
    const { api, storage, store } = setup();
    const events: string[] = [];
    storage.getRefreshToken.mockImplementation(async () => {
      events.push('read');
      return 'refresh-old';
    });
    storage.setRefreshToken.mockImplementation(async (token) => {
      events.push(`save:${token}`);
    });
    api.refresh.mockImplementation(async () => {
      events.push('refresh');
      return makeSession('PARENT', 'rotated');
    });
    api.me.mockImplementation(async () => {
      events.push('me');
      return { user: makeSession('PARENT', 'me').user };
    });

    await store.getState().restoreSession();

    expect(events).toEqual(['read', 'refresh', 'save:refresh-rotated', 'me']);
    expect(store.getState()).toMatchObject({ status: 'signedIn', user: { role: 'PARENT' } });
  });

  it('does not expose authenticated routes before /me confirms the restored user', async () => {
    const { api, storage, store } = setup();
    storage.getRefreshToken.mockResolvedValue('refresh-old');
    api.refresh.mockResolvedValue(makeSession('PARENT', 'rotated'));

    let confirmMeStarted!: () => void;
    let resolveMe!: (value: { user: ReturnType<typeof makeSession>['user'] }) => void;
    const meStarted = new Promise<void>((resolve) => (confirmMeStarted = resolve));
    api.me.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveMe = resolve;
          confirmMeStarted();
        }),
    );

    const restore = store.getState().restoreSession();
    await meStarted;

    expect(store.getState().status).toBe('restoring');
    resolveMe({ user: makeSession('PARENT', 'confirmed').user });
    await restore;
    expect(store.getState().status).toBe('signedIn');
  });

  it('revokes and rejects roles outside driver and parent', async () => {
    const { api, storage, store } = setup();
    api.login.mockResolvedValue(makeSession('ADMIN', 'admin'));

    await expect(store.getState().signIn('admin@example.com', 'password')).rejects.toThrow();

    expect(api.logout).toHaveBeenCalledWith('refresh-admin');
    expect(storage.setRefreshToken).not.toHaveBeenCalled();
    expect(store.getState()).toMatchObject({ status: 'signedOut', accessToken: null, user: null });
  });

  it('retains credentials and offers retry after a transient restore failure', async () => {
    const { api, storage, store } = setup();
    storage.getRefreshToken.mockResolvedValue('refresh-old');
    api.refresh
      .mockRejectedValueOnce(new Error('network unavailable'))
      .mockResolvedValueOnce(makeSession('PARENT', 'retry'));
    api.me.mockResolvedValue({ user: makeSession('PARENT', 'me').user });

    await store.getState().restoreSession();

    expect(store.getState()).toMatchObject({ status: 'unavailable', refreshToken: 'refresh-old' });
    await store.getState().restoreSession();
    expect(store.getState()).toMatchObject({ status: 'signedIn', refreshToken: 'refresh-retry' });
  });

  it('clears session after an invalid refresh token', async () => {
    const { api, storage, store } = setup();
    storage.getRefreshToken.mockResolvedValue('refresh-expired');
    api.refresh.mockRejectedValue({ status: 401 });

    await store.getState().restoreSession();

    expect(storage.clearRefreshToken).toHaveBeenCalledOnce();
    expect(store.getState()).toMatchObject({ status: 'signedOut', refreshToken: null, user: null });
  });

  it('always clears local credentials when logout request fails', async () => {
    const { api, storage, store } = setup();
    api.login.mockResolvedValue(makeSession('PARENT', 'login'));
    await store.getState().signIn('parent@example.com', 'password');
    api.logout.mockRejectedValue(new Error('network unavailable'));

    await store.getState().signOut();

    expect(storage.clearRefreshToken).toHaveBeenCalledOnce();
    expect(store.getState()).toMatchObject({ status: 'signedOut', accessToken: null, user: null });
  });

  it('shares a refresh across simultaneous requests', async () => {
    const { api, store } = setup();
    api.login.mockResolvedValue(makeSession('PARENT', 'login'));
    await store.getState().signIn('parent@example.com', 'password');
    let resolveRefresh!: (session: ReturnType<typeof makeSession>) => void;
    api.refresh.mockImplementation(
      () => new Promise((resolve) => (resolveRefresh = resolve)),
    );

    const first = store.getState().refreshAccessToken('access-login');
    const second = store.getState().refreshAccessToken('access-login');
    resolveRefresh(makeSession('PARENT', 'concurrent'));

    await expect(Promise.all([first, second])).resolves.toEqual([
      'access-concurrent',
      'access-concurrent',
    ]);
    expect(api.refresh).toHaveBeenCalledOnce();
  });
});

  it('revokes a newly created session when secure storage cannot save its refresh token', async () => {
    const { api, storage, store } = setup();
    api.login.mockResolvedValue(makeSession('PARENT', 'login'));
    storage.setRefreshToken.mockRejectedValue(new Error('secure storage unavailable'));

    await expect(store.getState().signIn('parent@example.com', 'password')).rejects.toThrow(
      'secure storage unavailable',
    );

    expect(api.logout).toHaveBeenCalledWith('refresh-login');
    expect(store.getState()).toMatchObject({ status: 'signedOut', accessToken: null, user: null });
  });
