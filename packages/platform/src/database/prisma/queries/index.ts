// ---------------------------------------------------------------------------
// Prisma: Query barrel export
// ---------------------------------------------------------------------------
// All query functions are exported here. Domains import from this barrel.
// To switch drivers, change the import path to '../drizzle/queries/index.js'.

// Catalog
export {
  findProductById,
  findProductBySlug,
  findProducts,
  findCategories,
  findProductImages,
  findProductVariants,
  findProductAttributes,
  findProductCategoryIds,
  findProductIdsByCategory,
  findProductTags,
  findCategoryById,
} from './catalog.js'

// Cart
export {
  createCart,
  findCart,
  findCartItems,
  findExistingCartItem,
  insertCartItem,
  updateCartItemQuantity,
  deleteCartItem,
  updateCart,
  deleteCart,
  findVariantById,
  findPrimaryImage,
} from './cart.js'

// Customers
export {
  findCustomerByEmail,
  findCustomerById,
  createCustomer,
  updateCustomer,
  findAddresses,
  findAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
} from './customers.js'

// Orders
export {
  createOrder,
  createOrderItem,
  createOrderHistory,
  findOrderById,
  findOrders,
  findOrderItems,
  findOrderHistory,
  updateOrder,
} from './orders.js'

// Store
export {
  findStoreInfo,
  createStoreInfo,
} from './store.js'

// Brands
export {
  findBrands,
  findBrandById,
  insertBrand,
} from './brands.js'

// Countries
export {
  findCountries,
  findCountryById,
  insertCountry,
} from './countries.js'

// Wishlists
export {
  findWishlistByCustomer,
  createWishlist,
  findWishlistItems,
  insertWishlistItem,
  deleteWishlistItem,
  findWishlistItemByProduct,
} from './wishlists.js'

// Reviews
export {
  findReviewsByProduct,
  getReviewSummaryByProduct,
  getReviewDistribution,
  insertReview,
} from './reviews.js'

// Promotions
export {
  findActivePromotions,
  findCouponByCode,
  findPromotionById,
  insertPromotion,
} from './promotions.js'

// Returns
export {
  findReturnsByOrder,
  findReturnById,
  findReturnItemsByReturn,
  insertReturn,
  insertReturnItem,
  updateReturnStatus,
} from './returns.js'
