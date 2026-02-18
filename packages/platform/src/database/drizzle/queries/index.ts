// ---------------------------------------------------------------------------
// Drizzle: Query barrel export
// ---------------------------------------------------------------------------
// All query functions are exported here. Domains import from this barrel.
// To switch drivers, change the import path to '../prisma/queries/index.js'.

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

// Admin — Catalog
export {
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminListProducts,
  adminCreateProductImage,
  adminDeleteProductImages,
  adminCreateProductVariant,
  adminDeleteProductVariants,
  adminCreateProductAttribute,
  adminDeleteProductAttributes,
  adminCreateProductTag,
  adminDeleteProductTags,
  adminCreateProductCategory,
  adminDeleteProductCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  adminFindChildCategories,
  adminFindLowStockProducts,
} from './admin-catalog.js'

// Admin — Orders
export {
  adminFindAllOrders,
  updateOrderTracking,
  countOrdersByStatus,
  sumOrderRevenue,
  findRecentOrders,
} from './admin-orders.js'

// Admin — Customers
export {
  adminFindAllCustomers,
  adminDeleteCustomer,
  countCustomers,
} from './admin-customers.js'

// Admin — Store
export {
  adminUpdateStoreInfo,
} from './admin-store.js'

// Admin — Users
export {
  findAdminByEmail,
  findAdminById,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  findAllAdminUsers,
  countAdminUsers,
} from './admin-users.js'

