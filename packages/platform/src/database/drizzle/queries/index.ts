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
  adminCreateProduct as insertProduct,
  adminUpdateProduct,
  adminUpdateProduct as updateProductById,
  adminDeleteProduct,
  adminDeleteProduct as deleteProductById,
  adminListProducts,
  adminListProducts as findAllProducts,
  adminCreateProductImage,
  adminCreateProductImage as insertProductImage,
  adminDeleteProductImages,
  adminDeleteProductImages as deleteProductImages,
  adminCreateProductVariant,
  adminCreateProductVariant as insertProductVariant,
  adminDeleteProductVariants,
  adminDeleteProductVariants as deleteProductVariants,
  adminCreateProductAttribute,
  adminCreateProductAttribute as insertProductAttribute,
  adminDeleteProductAttributes,
  adminDeleteProductAttributes as deleteProductAttributes,
  adminCreateProductTag,
  adminCreateProductTag as insertProductTag,
  adminDeleteProductTags,
  adminDeleteProductTags as deleteProductTags,
  adminCreateProductCategory,
  adminDeleteProductCategories,
  adminCreateCategory,
  adminCreateCategory as insertCategory,
  adminUpdateCategory,
  adminUpdateCategory as updateCategoryById,
  adminDeleteCategory,
  adminDeleteCategory as deleteCategoryById,
  adminFindChildCategories,
  adminFindChildCategories as findCategoryChildren,
  adminFindLowStockProducts,
  updateProductVariantById,
  setProductCategories,
  countProducts,
  countActiveProducts,
} from './admin-catalog.js'

// Admin — Orders
export {
  adminFindAllOrders,
  adminFindAllOrders as findAllOrders,
  updateOrderTracking,
  countOrdersByStatus,
  countOrders,
  sumOrderRevenue,
  findRecentOrders,
} from './admin-orders.js'

// Admin — Customers
export {
  adminFindAllCustomers,
  adminFindAllCustomers as findAllCustomers,
  adminDeleteCustomer,
  adminDeleteCustomer as deleteCustomerById,
  countCustomers,
} from './admin-customers.js'

// Admin — Store
export {
  adminUpdateStoreInfo,
  adminUpdateStoreInfo as updateStoreInfo,
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

// Profiles (cross-merchant buyer identity)
export {
  createProfile,
  findProfileById,
  findProfileByEmail,
  findProfileByPhone,
  updateProfile,
  deleteProfile,
  findProfileAddresses,
  findProfileAddressById,
  createProfileAddress,
  updateProfileAddress,
  deleteProfileAddress,
  findProfilePaymentMethods,
  createProfilePaymentMethod,
  deleteProfilePaymentMethod,
  findProfileMerchantLinks,
  upsertProfileMerchantLink,
  createOtpCode,
  findActiveOtpCode,
  markOtpVerified,
  incrementOtpAttempts,
  deleteExpiredOtpCodes,
} from './profiles.js'

