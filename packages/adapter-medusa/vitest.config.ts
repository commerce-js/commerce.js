import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'adapter-medusa',
    include: ['src/**/*.test.ts'],
    environment: 'node',
    clearMocks: true,
    restoreMocks: true,
  },
})
