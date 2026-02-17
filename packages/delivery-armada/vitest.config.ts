import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'delivery-armada',
    include: ['src/**/*.test.ts'],
    environment: 'node',
    clearMocks: true,
    restoreMocks: true,
  },
})
