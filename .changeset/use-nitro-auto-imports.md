---
"@commercejs/nuxt": patch
---

Fix CF Workers deployment by rewriting route handler imports to use
Nitro's `#imports` virtual module instead of explicit package paths.

Explicit imports caused Rollup to create duplicate module identities
for functions like defineCommerceHandler and defineEventHandler,
leading to $1 renames and ReferenceError at runtime.
