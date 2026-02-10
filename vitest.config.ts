import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      'packages/types',
      'packages/adapter-salla',
    ],
  },
})
