/**
 * Vitest 配置
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'examples/',
        'docs/',
      ],
      include: ['packages/core/src/**/*.ts'],
      all: true,
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
    include: ['packages/core/__tests__/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'examples'],
    testTimeout: 10000,
  },
});

