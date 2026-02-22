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

// Admin: Catalog
export {
  insertProduct,
  insertProduct as adminCreateProduct,
  updateProductById,
  updateProductById as adminUpdateProduct,
  deleteProductById,
  deleteProductById as adminDeleteProduct,
  findAllProducts,
  findAllProducts as adminListProducts,
  insertProductImage,
  insertProductImage as adminCreateProductImage,
  deleteProductImages,
  deleteProductImages as adminDeleteProductImages,
  insertProductVariant,
  insertProductVariant as adminCreateProductVariant,
  deleteProductVariants,
  deleteProductVariants as adminDeleteProductVariants,
  updateProductVariantById,
  insertProductAttribute,
  insertProductAttribute as adminCreateProductAttribute,
  deleteProductAttributes,
  deleteProductAttributes as adminDeleteProductAttributes,
  insertProductTag,
  insertProductTag as adminCreateProductTag,
  deleteProductTags,
  deleteProductTags as adminDeleteProductTags,
  setProductCategories,
  adminCreateProductCategory,
  adminDeleteProductCategories,
  insertCategory,
  insertCategory as adminCreateCategory,
  updateCategoryById,
  updateCategoryById as adminUpdateCategory,
  deleteCategoryById,
  deleteCategoryById as adminDeleteCategory,
  findCategoryChildren,
  findCategoryChildren as adminFindChildCategories,
  adminFindLowStockProducts,
  countProducts,
  countActiveProducts,
} from './admin-catalog.js'

// Admin: Orders
export {
  findAllOrders,
  findAllOrders as adminFindAllOrders,
  updateOrderTracking,
  countOrdersByStatus,
  countOrders,
  sumOrderRevenue,
  findRecentOrders,
} from './admin-orders.js'

// Admin: Customers
export {
  findAllCustomers,
  findAllCustomers as adminFindAllCustomers,
  deleteCustomerById,
  deleteCustomerById as adminDeleteCustomer,
  countCustomers,
} from './admin-customers.js'

// Admin: Store
export {
  updateStoreInfo,
  updateStoreInfo as adminUpdateStoreInfo,
} from './admin-store.js'

// Admin: Users
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
} from './profiles.js'
