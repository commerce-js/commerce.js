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
      'packages/core',
      'packages/analytics-ga',
      'packages/delivery-armada',
      'packages/delivery-parcel',
      'packages/notification-resend',
      'packages/notification-smtp',
      'packages/storage-s3',
      // packages/cloud and packages/platform are intentionally absent: their
      // tests are integration suites that need real Neon/Cloudflare credentials
      // and a live database, so they run via `pnpm --filter <pkg> test`.
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
