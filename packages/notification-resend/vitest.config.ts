import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'notification-resend',
    include: ['src/**/*.test.ts'],
    environment: 'node',
    clearMocks: true,
    restoreMocks: true,
  },
})
