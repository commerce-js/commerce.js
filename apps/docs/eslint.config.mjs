// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  // Your custom configs here
  {
    rules: {
      // Same ratchet as the packages and the storefront: `any` is reported but
      // does not fail the build, so existing demo components can adopt types
      // incrementally instead of all at once.
      '@typescript-eslint/no-explicit-any': 'warn'
    }
  }
)
