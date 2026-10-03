import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    extensions: ['.native.ts', '.web.ts', '.ts', '.tsx', '.mjs', '.js', '.jsx', '.json'],
  },
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    clearMocks: true,
    restoreMocks: true,
  },
});
