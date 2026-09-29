// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  // Custom configs can be layered on top of the generated Nuxt config here.
  {
    rules: {
      // Product descriptions come from the merchant's own catalogue, but they
      // are still untrusted input rendered with v-html. Kept as a warning so it
      // stays visible without failing the build.
      'vue/no-v-html': 'warn',
      // Google Maps is an optional enhancement — a failed geocode or script load
      // must never break checkout, so those failures are swallowed deliberately.
      'no-empty': ['error', { allowEmptyCatch: true }],
      // Same ratchet as the packages: `any` is reported but does not fail the
      // build. Most of these are the Google Maps SDK, which has no types here.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
)
