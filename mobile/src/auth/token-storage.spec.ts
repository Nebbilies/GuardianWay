import { beforeEach, describe, expect, it, vi } from 'vitest';
import { tokenStorage as nativeStorage } from './token-storage.native';
import { tokenStorage as webStorage } from './token-storage.web';

const secureStore = vi.hoisted(() => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

vi.mock('expo-secure-store', () => secureStore);

describe('token storage adapters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses SecureStore for the native refresh token', async () => {
    secureStore.getItemAsync.mockResolvedValue('refresh-native');

    await expect(nativeStorage.getRefreshToken()).resolves.toBe('refresh-native');
    await nativeStorage.setRefreshToken('refresh-next');
    await nativeStorage.clearRefreshToken();

    expect(secureStore.getItemAsync).toHaveBeenCalledOnce();
    expect(secureStore.setItemAsync).toHaveBeenCalledWith('guardianway.refresh-token', 'refresh-next');
    expect(secureStore.deleteItemAsync).toHaveBeenCalledWith('guardianway.refresh-token');
  });

  it('keeps web smoke-test tokens in memory only', async () => {
    await webStorage.setRefreshToken('refresh-web');
    await expect(webStorage.getRefreshToken()).resolves.toBe('refresh-web');
    await webStorage.clearRefreshToken();
    await expect(webStorage.getRefreshToken()).resolves.toBeNull();
  });
});
