import { defineConfig } from 'vitest/config'

// biome-ignore lint/style/noDefaultExport: vite expects default export
export default defineConfig({
  test: {
    globals: true,
    maxWorkers: 1,
    pool: 'threads',
    watch: false,
    environment: 'node',
    setupFiles: ['test/envSetupHook.ts'],
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/db/**', 'src/server.ts', 'src/**/*.spec.ts', 'src/**/*.test.ts'],
      reporter: ['text'],
    },
  },
})
