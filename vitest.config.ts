import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      'packages/types',
      'packages/adapter-salla',
      'packages/adapter-medusa',
      'packages/webhook-verifier',
      'packages/checkout',
      'packages/payment-tap',
      'apps/dashboard',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: [
        'packages/checkout/src/**/*.ts',
        'packages/payment-tap/src/**/*.ts',
        'packages/adapter-salla/src/**/*.ts',
        'packages/adapter-medusa/src/**/*.ts',
        'packages/webhook-verifier/src/**/*.ts',
      ],
      exclude: [
        '**/__tests__/**',
        '**/*.test.ts',
        '**/*.d.ts',
        '**/dist/**',
        '**/index.ts',
        'packages/types/src/**',
      ],
    },
  },
})
