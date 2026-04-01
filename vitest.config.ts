import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    server: {
      deps: {
        // Mock server-only so it doesn't throw in test environment
        inline: ['server-only'],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Mock server-only package in tests
      'server-only': path.resolve(__dirname, './src/__mocks__/server-only.ts'),
    },
  },
});
