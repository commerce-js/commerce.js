---
"@commercejs/platform": minor
---

feat(platform): polish Tier 1 domains — seed data, review distribution, promotions & returns

- Add seed data for brands (3), countries (6 GCC), and reviews (6) to both Drizzle and Prisma seeds
- Implement `getReviewDistribution` query to compute actual star breakdowns (was hardcoded `[0,0,0,0,0]`)
- Wire promotions domain (`getActivePromotions`, `validateCoupon`) and returns domain (`createReturn`, `getReturn`, `getReturns`, `getOrderReturns`, `cancelReturn`) into adapter
- Remove duplicate `applyCoupon` from promotions (cart owns it)
- Add comprehensive README, docs site page, and updated API reference
