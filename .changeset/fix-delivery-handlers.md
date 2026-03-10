---
"@commercejs/nuxt": patch
---

Fix transformHandler regex to handle single-param delivery handlers
that use defineCommerceHandler(async (event) => {}). Previously the
regex required 2+ params (event, adapter) and missed 5 delivery handlers.
