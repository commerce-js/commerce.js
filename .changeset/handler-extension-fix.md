---
"@commercejs/nuxt": patch
---

Add .js extension to handler import path for Nitro compatibility

Route files import defineCommerceHandler from the package exports path
but Nitro requires the `.js` extension to resolve the file from
node_modules. Changes import to
`@commercejs/nuxt/runtime/server/utils/handler.js`.
