import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'html'],
      include: ['src/lib/**/*.ts', 'src/hooks/**/*.ts'],
      exclude: ['**/*.test.*'],
      // Ratchet: just below the measured totals (Nov 2026). Raise as coverage grows,
      // never lower. The three files below were already held to 80%.
      thresholds: {
        statements: 64,
        branches: 57,
        functions: 69,
        lines: 66,
        'src/lib/{extras,game-display,steam-extras}.ts': {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
      },
    },
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
