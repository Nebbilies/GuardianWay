import { beforeEach, describe, expect, it, vi } from 'vitest';

import { authApi, HttpError } from './auth-api';

const fetchMock = vi.fn<typeof fetch>();
const user = { id: 'u-1', name: 'Parent', email: 'parent@example.com', role: 'PARENT', schoolId: 's-1' };
const session = {
  tokenType: 'Bearer', accessToken: 'access', refreshToken: 'refresh',
  accessTokenExpiresIn: 900, refreshTokenExpiresIn: 604800,
};

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe('authApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('EXPO_PUBLIC_API_URL', 'http://localhost:8000/');
  });

  it('posts credentials to the mobile login endpoint', async () => {
    const payload = { user, session };
    fetchMock.mockResolvedValueOnce(jsonResponse(payload));

    await expect(authApi.login('parent@example.com', 'password')).resolves.toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/api/auth/token/login',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'parent@example.com', password: 'password' }),
      }),
    );
  });

  it('refreshes, logs out, and reads the current user with bearer auth', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ user, session }))
      .mockResolvedValueOnce(jsonResponse({ message: 'ok' }))
      .mockResolvedValueOnce(jsonResponse({ user }));

    await authApi.refresh('refresh-token');
    await authApi.logout('refresh-token');
    await authApi.me('access-token');

    expect(fetchMock.mock.calls[0]).toEqual([
      'http://localhost:8000/api/auth/token/refresh',
      expect.objectContaining({ body: JSON.stringify({ refreshToken: 'refresh-token' }) }),
    ]);
    expect(fetchMock.mock.calls[1]).toEqual([
      'http://localhost:8000/api/auth/token/logout',
      expect.objectContaining({ body: JSON.stringify({ refreshToken: 'refresh-token' }) }),
    ]);
    expect(fetchMock.mock.calls[2]).toEqual([
      'http://localhost:8000/api/auth/me',
      expect.objectContaining({ headers: { Authorization: 'Bearer access-token' } }),
    ]);
  });

  it('normalizes API failures without exposing response tokens', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ message: 'Email hoặc mật khẩu không đúng', accessToken: 'must-not-leak' }, 401),
    );

    const request = authApi.login('parent@example.com', 'wrong');
    await expect(request).rejects.toBeInstanceOf(HttpError);
    await expect(request).rejects.toMatchObject({
      status: 401,
      message: 'Email hoặc mật khẩu không đúng',
    });
  });

  it('rejects a successful login response missing its required session contract', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ user: { id: 'u-1' } }));

    await expect(authApi.login('parent@example.com', 'password')).rejects.toThrow(
      'Phản hồi đăng nhập không hợp lệ',
    );
  });
});
