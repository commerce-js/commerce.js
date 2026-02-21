# @commercejs/webhook-verifier

## 1.1.0

### Minor Changes

- [`90edfff`](https://github.com/commerce-js/commerce.js/commit/90edfffc7c2e1532d329ab3dcc48492d5d27f965) Thanks [@masterde](https://github.com/masterde)! - Migrated from Node.js `crypto.createHmac` to Web Crypto API (`crypto.subtle`) for cross-runtime compatibility. Works on Cloudflare Workers, Node.js 18+, Deno, and Bun.

  **Breaking**: `verify()` is now async (returns `Promise<VerificationResult>`).
