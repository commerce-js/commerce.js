import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'analytics-ga',
    include: ['src/**/*.test.ts'],
    environment: 'node',
    clearMocks: true,
    restoreMocks: true,
  },
})
