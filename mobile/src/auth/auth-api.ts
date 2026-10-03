export type MobileRole = 'DRIVER' | 'PARENT' | 'ADMIN' | 'SUPER_ADMIN';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: MobileRole;
  schoolId: string | null;
};

export type AuthSessionResponse = {
  user: AuthUser;
  session: {
    tokenType: 'Bearer';
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresIn: number;
    refreshTokenExpiresIn: number;
  };
};

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

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(getApiUrl(path), init);
  } catch (error) {
    throw new Error('Không thể kết nối máy chủ', { cause: error });
  }

  const payload = await response.json().catch(() => undefined);
  if (!response.ok) {
    const message =
      typeof payload?.message === 'string' ? payload.message : 'Yêu cầu không thành công';
    throw new HttpError(response.status, message);
  }

  return payload as T;
}

function post<T>(path: string, body: unknown) {
  return request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export const authApi = {
  login(email: string, password: string) {
    return post<AuthSessionResponse>('/api/auth/token/login', { email, password });
  },

  refresh(refreshToken: string) {
    return post<AuthSessionResponse>('/api/auth/token/refresh', { refreshToken });
  },

  logout(refreshToken: string) {
    return post<{ message: string }>('/api/auth/token/logout', { refreshToken });
  },

  me(accessToken: string) {
    return request<{ user: AuthUser }>('/api/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  },
};
