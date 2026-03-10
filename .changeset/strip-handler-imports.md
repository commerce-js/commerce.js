---
"@commercejs/nuxt": patch
---

Fix defineCommerceHandler runtime error on CF Workers by stripping
explicit import statements from generated route handler templates.

Since addServerImportsDir already registers the utils directory,
Nitro auto-imports provide defineCommerceHandler. Keeping explicit
imports caused Rollup to see two module identities for the same
function, renaming one to defineCommerceHandler$1 while route handlers
still referenced the original name — causing ReferenceError at runtime.
