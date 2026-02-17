import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'delivery-parcel',
    include: ['src/**/*.test.ts'],
    environment: 'node',
    clearMocks: true,
    restoreMocks: true,
  },
})
