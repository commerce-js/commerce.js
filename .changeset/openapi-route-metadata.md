---
"@commercejs/nuxt": minor
"@commercejs/types": patch
---

feat(nuxt): add OpenAPI spec generation via Nitro experimental.openAPI

- Enable `experimental.openAPI` in module config with Scalar UI theme
- Add `defineRouteMeta` to all 46 server routes with tags, descriptions, and parameters
- Routes organized into 13 OpenAPI tags: Store, Catalog, Geography, Auth, Cart, Checkout, Customer, Addresses, Orders, Reviews, Wishlist, Returns, Promotions
- Auto-generated spec at `/_openapi.json`, interactive docs at `/_scalar`

fix(types): add CONFIGURATION_ERROR to CommerceErrorCode union
