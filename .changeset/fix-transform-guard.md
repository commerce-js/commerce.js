---
"@commercejs/nuxt": patch
---

Fix transformHandler to only inject try/catch error handling when
defineCommerceHandler was actually replaced, not for handlers that
already use defineEventHandler directly (like change-password.post.js).
