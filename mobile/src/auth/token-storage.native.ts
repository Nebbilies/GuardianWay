import * as SecureStore from 'expo-secure-store';

const REFRESH_TOKEN_KEY = 'guardianway.refresh-token';

export const tokenStorage = {
  getRefreshToken() {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  setRefreshToken(token: string) {
    return SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  },

  clearRefreshToken() {
    return SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};
