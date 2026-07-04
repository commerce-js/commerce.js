import { defineConfig } from 'vitest/config'

// Pure server-util unit tests only — no Nuxt/Nitro runtime. Anything tested
// here must be importable without the Nuxt context so the project runs offline
// and fast in CI (see .github/workflows/ci.yml dashboard job). Tests that need
// auto-imports (useRuntimeConfig, import.meta.dev) belong in a Nuxt test env,
// not this project.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['server/**/*.test.ts'],
  },
})
