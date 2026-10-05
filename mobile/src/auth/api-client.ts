import { getApiUrl, HttpError } from './auth-api';
import { useAuthStore, type AuthStore } from './auth-store';

type ApiClientOptions = {
  store: AuthStore;
  fetchImpl?: typeof fetch;
};

export function createApiClient({ store, fetchImpl = fetch }: ApiClientOptions) {
  return async function apiRequest(path: string, init: RequestInit = {}) {
    const accessToken = store.getState().accessToken;
    if (!accessToken) {
      throw new HttpError(401, 'Phiên đăng nhập không hợp lệ');
    }

    const send = (token: string) => {
      const headers = new Headers(init.headers);
      headers.set('Authorization', `Bearer ${token}`);
      return fetchImpl(getApiUrl(path), { ...init, headers });
    };

    const response = await send(accessToken);
    if (response.status !== 401) {
      return response;
    }

    try {
      const refreshedAccessToken = await store.getState().refreshAccessToken(accessToken);
      if (!refreshedAccessToken) {
        await store.getState().signOut();
        return response;
      }

      const retryResponse = await send(refreshedAccessToken);
      if (retryResponse.status === 401) {
        await store.getState().signOut();
      }
      return retryResponse;
    } catch (error) {
      if (error instanceof HttpError && error.status === 401) {
        return response;
      }
      throw error;
    }
  };
}

export const apiRequest = createApiClient({ store: useAuthStore });
