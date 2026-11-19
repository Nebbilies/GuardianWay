import { decodeAuthSession, decodeCurrentUser, decodeErrorMessage, decodeLogout } from './auth-contract';
export type { MobileRole, AuthUser, AuthSessionResponse } from './auth-contract';

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function getApiUrl(path: string) {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '');
  if (!baseUrl) {
    throw new Error('Thiếu cấu hình EXPO_PUBLIC_API_URL');
  }
  return `${baseUrl}${path}`;
}

async function request<T>(path: string, init: RequestInit, decode: (value: unknown) => T): Promise<T> {
  let response: Response;
  try {
    response = await fetch(getApiUrl(path), init);
  } catch (error) {
    throw new Error('Không thể kết nối máy chủ', { cause: error });
  }

  const payload: unknown = await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new HttpError(response.status, decodeErrorMessage(payload));
  }

  return decode(payload);
}

function post<T>(path: string, body: unknown, decode: (value: unknown) => T) {
  return request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, decode);
}

export const authApi = {
  login(email: string, password: string) {
    return post('/api/auth/token/login', { email, password }, decodeAuthSession);
  },

  refresh(refreshToken: string) {
    return post('/api/auth/token/refresh', { refreshToken }, decodeAuthSession);
  },

  logout(refreshToken: string) {
    return post('/api/auth/token/logout', { refreshToken }, decodeLogout);
  },

  me(accessToken: string) {
    return request('/api/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    }, decodeCurrentUser);
  },
};
