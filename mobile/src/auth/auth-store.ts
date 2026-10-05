import { create } from 'zustand';

import { authApi, HttpError, type AuthSessionResponse, type AuthUser } from './auth-api';
import { tokenStorage } from './token-storage';

type SessionStatus = 'restoring' | 'signedOut' | 'signedIn' | 'unavailable';
type TokenStorage = typeof tokenStorage;
type AuthApi = typeof authApi;

type AuthState = {
  status: SessionStatus;
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  restoreError: string | null;
  restoreSession: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAccessToken: (rejectedAccessToken?: string) => Promise<string | null>;
};

type AuthStoreDependencies = { api: AuthApi; storage: TokenStorage };

export class UnsupportedRoleError extends Error {
  constructor() {
    super('Ứng dụng chỉ hỗ trợ tài khoản tài xế và phụ huynh');
    this.name = 'UnsupportedRoleError';
  }
}

const initialState = {
  status: 'restoring' as SessionStatus,
  user: null,
  accessToken: null,
  refreshToken: null,
  restoreError: null,
};

function isSupportedRole(user: AuthUser) {
  return user.role === 'DRIVER' || user.role === 'PARENT';
}

function isUnauthorized(error: unknown) {
  return error instanceof HttpError
    ? error.status === 401
    : typeof error === 'object' && error !== null && 'status' in error && error.status === 401;
}

export function createAuthStore({ api, storage }: AuthStoreDependencies) {
  let refreshRequest: Promise<string | null> | null = null;

  return create<AuthState>((set, get) => {
    const resetSession = () => set({ ...initialState, status: 'signedOut' });

    const clearStoredSession = async () => {
      try {
        await storage.clearRefreshToken();
      } finally {
        resetSession();
      }
    };

    const rejectUnsupportedRole = async (session: AuthSessionResponse): Promise<never> => {
      try {
        await api.logout(session.session.refreshToken);
      } catch {
        // Local rejection must not depend on the network.
      }
      await clearStoredSession();
      throw new UnsupportedRoleError();
    };

    const applySession = async (session: AuthSessionResponse) => {
      if (!isSupportedRole(session.user)) {
        await rejectUnsupportedRole(session);
      }

      try {
        await storage.setRefreshToken(session.session.refreshToken);
      } catch (error) {
        try {
          await api.logout(session.session.refreshToken);
        } catch {
          // Revoke best-effort if local secure storage is unavailable.
        }
        await clearStoredSession();
        throw error;
      }
      set({
        status: get().status === 'restoring' ? 'restoring' : 'signedIn',
        user: session.user,
        accessToken: session.session.accessToken,
        refreshToken: session.session.refreshToken,
        restoreError: null,
      });
      return session.session.accessToken;
    };

    const refresh = async (rejectedAccessToken?: string) => {
      const current = get();
      if (rejectedAccessToken && current.accessToken && current.accessToken !== rejectedAccessToken) {
        return current.accessToken;
      }
      if (!current.refreshToken) {
        return null;
      }

      const session = await api.refresh(current.refreshToken);
      return applySession(session);
    };

    return {
      ...initialState,

      async restoreSession() {
        set({ status: 'restoring', restoreError: null });
        try {
          const storedRefreshToken = await storage.getRefreshToken();
          if (!storedRefreshToken) {
            resetSession();
            return;
          }

          set({ refreshToken: storedRefreshToken });
          const accessToken = await get().refreshAccessToken();
          if (!accessToken) {
            resetSession();
            return;
          }

          const { user } = await api.me(accessToken);
          if (!isSupportedRole(user)) {
            await clearStoredSession();
            return;
          }
          set({ user, status: 'signedIn', restoreError: null });
        } catch (error) {
          if (isUnauthorized(error) || error instanceof UnsupportedRoleError) {
            if (get().status !== 'signedOut' || get().refreshToken !== null) {
              await clearStoredSession();
            }
            return;
          }

          set({
            status: 'unavailable',
            restoreError: 'Không thể khôi phục phiên. Kiểm tra kết nối rồi thử lại.',
          });
        }
      },

      async signIn(email, password) {
        const session = await api.login(email, password);
        await applySession(session);
      },

      async signOut() {
        const refreshToken = get().refreshToken;
        const revocation = refreshToken
          ? api.logout(refreshToken).catch(() => undefined)
          : Promise.resolve();
        await clearStoredSession();
        if (refreshToken) {
          await revocation;
        }
      },

      async refreshAccessToken(rejectedAccessToken) {
        if (!refreshRequest) {
          refreshRequest = refresh(rejectedAccessToken).finally(() => {
            refreshRequest = null;
          });
        }
        try {
          return await refreshRequest;
        } catch (error) {
          if (isUnauthorized(error) && (get().status !== 'signedOut' || get().refreshToken !== null)) {
            await clearStoredSession();
          }
          throw error;
        }
      },
    };
  });
}

export const useAuthStore = createAuthStore({ api: authApi, storage: tokenStorage });
export type AuthStore = typeof useAuthStore;
