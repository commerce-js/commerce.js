---
"@commercejs/platform": patch
---

Move @neondatabase/serverless from peerDependencies to regular dependencies. This ensures the Neon driver is always installed with the package, fixing Cloudflare Pages builds where externals are not allowed.
