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

const INVALID_SESSION = 'Phản hồi đăng nhập không hợp lệ';

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(INVALID_SESSION);
  }
  return value as Record<string, unknown>;
}

function nonempty(value: unknown): string {
  if (typeof value !== 'string' || !value.trim())
    throw new Error(INVALID_SESSION);
  return value;
}

function role(value: unknown): MobileRole {
  if (
    value === 'DRIVER' ||
    value === 'PARENT' ||
    value === 'ADMIN' ||
    value === 'SUPER_ADMIN'
  ) {
    return value;
  }
  throw new Error(INVALID_SESSION);
}

export function decodeAuthUser(value: unknown): AuthUser {
  const user = object(value);
  const userRole = role(user.role);
  const schoolId = user.schoolId === null ? null : nonempty(user.schoolId);
  if ((userRole === 'SUPER_ADMIN') !== (schoolId === null))
    throw new Error(INVALID_SESSION);
  return {
    id: nonempty(user.id),
    name: nonempty(user.name),
    email: nonempty(user.email),
    role: userRole,
    schoolId,
  };
}

function seconds(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw new Error(INVALID_SESSION);
  }
  return value;
}

export function decodeAuthSession(value: unknown): AuthSessionResponse {
  const result = object(value);
  const session = object(result.session);
  if (session.tokenType !== 'Bearer') throw new Error(INVALID_SESSION);
  return {
    user: decodeAuthUser(result.user),
    session: {
      tokenType: 'Bearer',
      accessToken: nonempty(session.accessToken),
      refreshToken: nonempty(session.refreshToken),
      accessTokenExpiresIn: seconds(session.accessTokenExpiresIn),
      refreshTokenExpiresIn: seconds(session.refreshTokenExpiresIn),
    },
  };
}

export function decodeCurrentUser(value: unknown): { user: AuthUser } {
  return { user: decodeAuthUser(object(value).user) };
}

export function decodeLogout(value: unknown): { message: string } {
  return { message: nonempty(object(value).message) };
}

export function decodeErrorMessage(value: unknown): string {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const problem = value as Record<string, unknown>;
    if (typeof problem.detail === 'string' && problem.detail)
      return problem.detail;
    if (typeof problem.message === 'string' && problem.message)
      return problem.message;
  }
  return 'Yêu cầu không thành công';
}
