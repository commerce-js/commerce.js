import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    // tsc emits the compiled tests into dist, so without this the same suite
    // runs twice: once from source and once from the built output.
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
})
