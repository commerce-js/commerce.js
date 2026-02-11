# @commercejs/platform

## 0.2.0

### Minor Changes

- [`0a3a167`](https://github.com/commerce-js/commerce.js/commit/0a3a1678bcc1f22607da15ff207efcee309d89c2) Thanks [@masterde](https://github.com/masterde)! - feat(platform): polish Tier 1 domains — seed data, review distribution, promotions & returns

  - Add seed data for brands (3), countries (6 GCC), and reviews (6) to both Drizzle and Prisma seeds
  - Implement `getReviewDistribution` query to compute actual star breakdowns (was hardcoded `[0,0,0,0,0]`)
  - Wire promotions domain (`getActivePromotions`, `validateCoupon`) and returns domain (`createReturn`, `getReturn`, `getReturns`, `getOrderReturns`, `cancelReturn`) into adapter
  - Remove duplicate `applyCoupon` from promotions (cart owns it)
  - Add comprehensive README, docs site page, and updated API reference
