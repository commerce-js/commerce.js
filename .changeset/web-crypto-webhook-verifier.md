---
"@commercejs/webhook-verifier": minor
---

Migrated from Node.js `crypto.createHmac` to Web Crypto API (`crypto.subtle`) for cross-runtime compatibility. Works on Cloudflare Workers, Node.js 18+, Deno, and Bun.

**Breaking**: `verify()` is now async (returns `Promise<VerificationResult>`).
