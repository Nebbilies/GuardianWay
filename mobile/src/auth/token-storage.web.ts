let refreshToken: string | null = null;

export const tokenStorage = {
  async getRefreshToken() {
    return refreshToken;
  },

  async setRefreshToken(token: string) {
    refreshToken = token;
  },

  async clearRefreshToken() {
    refreshToken = null;
  },
};
