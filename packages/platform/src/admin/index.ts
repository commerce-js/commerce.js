// ---------------------------------------------------------------------------
// Admin API factory — assembles all admin domain modules into a single API
// ---------------------------------------------------------------------------

import type { AdminAPI } from './types.js'
import { createAdminAuthDomain } from './auth.js'
import { createAdminProductsDomain } from './products.js'
import { createAdminCategoriesDomain } from './categories.js'
import { createAdminOrdersDomain } from './orders.js'
import { createAdminCustomersDomain } from './customers.js'
import { createAdminStoreDomain } from './store.js'
import { createAdminInventoryDomain } from './inventory.js'
import { createAdminAnalyticsDomain } from './analytics.js'
import { createAdminActivityDomain } from './activity.js'
import {
  countOrdersByStatus,
  sumOrderRevenue,
  findRecentOrders,
  countCustomers,
  findOrderItems,
  countProducts,
  countActiveProducts,
  countOrders,
} from '../database/index.js'
import { localized, priceRequired, price, img, parseJsonField } from '../domains/helpers.js'

/**
 * Create an AdminAPI — the merchant-facing management interface.
 *
 * Only available for the native platform (Commerce.js Cloud).
 * External adapters manage their own admin dashboards.
 *
 * @example
 * ```ts
 * const { adapter, admin } = await createPlatformAdapter({ currency: 'SAR' })
 * const product = await admin.createProduct({ name: 'T-Shirt', price: 99 })
 * ```
 */
export function createAdminAPI(currency: string): AdminAPI {
  const auth = createAdminAuthDomain()
  const products = createAdminProductsDomain(currency)
  const categories = createAdminCategoriesDomain()
  const orders = createAdminOrdersDomain(currency)
  const customers = createAdminCustomersDomain()
  const store = createAdminStoreDomain()
  const inventory = createAdminInventoryDomain(currency)
  const analytics = createAdminAnalyticsDomain()
  const activity = createAdminActivityDomain()

  return {
    // Auth
    auth,
    // Products
    getProduct: products.getProduct,
    createProduct: products.createProduct,
    updateProduct: products.updateProduct,
    deleteProduct: products.deleteProduct,
    listProducts: products.listProducts,

    // Categories
    listCategories: categories.listCategories,
    getCategory: categories.getCategory,
    createCategory: categories.createCategory,
    updateCategory: categories.updateCategory,
    deleteCategory: categories.deleteCategory,

    // Orders
    listOrders: orders.listOrders,
    getOrder: orders.getOrder,
    fulfillOrder: orders.fulfillOrder,
    refundOrder: orders.refundOrder,

    // Customers
    listCustomers: customers.listCustomers,
    getCustomer: customers.getCustomer,
    deleteCustomer: customers.deleteCustomer,

    // Store
    getStoreSettings: store.getStoreSettings,
    updateStoreSettings: store.updateStoreSettings,

    // Inventory
    updateInventory: inventory.updateInventory,
    getLowStockProducts: inventory.getLowStockProducts,

    // Analytics
    getRevenueTimeSeries: analytics.getRevenueTimeSeries,
    getTopProducts: analytics.getTopProducts,
    getTopCustomers: analytics.getTopCustomers,

    // Activity log (audit trail)
    recordActivity: activity.recordActivity,
    listActivity: activity.listActivity,

    // Dashboard stats
    async getDashboardStats() {
      const [
        totalProducts,
        activeProducts,
        totalOrders,
        totalRevenue,
        totalCustomers,
        ordersByStatus,
        recentOrderRows,
      ] = await Promise.all([
        countProducts(),
        countActiveProducts(),
        countOrders(),
        sumOrderRevenue(),
        countCustomers(),
        countOrdersByStatus(),
        findRecentOrders(5),
      ])

      // Map recent orders to full Order type
      const recentOrders = await Promise.all(
        recentOrderRows.map(async (row: any) => {
          const items = await findOrderItems(row.id)
          return {
            id: row.id,
            orderNumber: row.orderNumber,
            status: row.status,
            items: items.map((i: any) => ({
              id: i.id,
              productId: i.productId,
              variantId: i.variantId ?? null,
              name: localized(i.name, i.nameAr),
              image: i.image ? img(i.image, null) : null,
              quantity: i.quantity,
              price: priceRequired(i.price, currency),
              totalPrice: priceRequired(i.totalPrice, currency),
              fulfillmentStatus: i.fulfillmentStatus as any,
              productType: i.productType as any,
              digital: null,
              event: null,
            })),
            totals: {
              subtotal: priceRequired(row.subtotal, currency),
              shipping: price(row.shippingCost, currency),
              tax: price(row.tax, currency),
              discount: price(row.discount, currency),
              total: priceRequired(row.total, currency),
            },
            shippingAddress: parseJsonField(row.shippingAddress),
            billingAddress: parseJsonField(row.billingAddress),
            shippingMethod: null,
            paymentMethod: null,
            trackingNumber: row.trackingNumber ?? null,
            trackingUrl: row.trackingUrl ?? null,
            note: row.note ?? null,
            customerId: row.customerId ?? null,
            requiresShipping: Boolean(row.requiresShipping),
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            paymentTerms: null,
            purchaseOrderNumber: null,
            companyName: null,
            giftCardCodesApplied: [],
            giftCardAmountApplied: null,
          }
        }),
      )

      const cancelledCount = ordersByStatus['cancelled'] ?? 0
      const refundedCount = ordersByStatus['refunded'] ?? 0
      // AOV and refund rate share the same "revenue-eligible" denominator:
      // total − cancelled − refunded. Cancelled orders never paid, refunded
      // orders returned their money — both are excluded from sumOrderRevenue.
      const completedCount = Math.max(totalOrders - cancelledCount - refundedCount, 0)
      const avgOrderValue = completedCount > 0 ? totalRevenue / completedCount : 0
      // Refund rate = refunded / (total − cancelled). Cancelled orders don't
      // dilute the denominator because they never paid.
      const refundDenominator = Math.max(totalOrders - cancelledCount, 0)
      const refundRate = refundDenominator > 0 ? refundedCount / refundDenominator : 0

      return {
        totalProducts,
        activeProducts,
        totalOrders,
        totalRevenue,
        totalCustomers,
        recentOrders,
        ordersByStatus,
        avgOrderValue,
        refundRate,
      }
    },
  }
}

// Re-export types
export type { AdminAPI } from './types.js'
export type {
  AdminUser,
  AdminUserSafe,
  CreateProductInput,
  UpdateProductInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  AdminListOrdersParams,
  FulfillOrderInput,
  UpdateStoreInput,
  StoreSettings,
  UpdateInventoryInput,
  DashboardStats,
  AdminListParams,
  CreateProductImageInput,
  CreateVariantInput,
  CreateAttributeInput,
  AdminListProductsParams,
  AnalyticsGranularity,
  RevenueTimeSeriesParams,
  RevenueBucket,
  TopProductsParams,
  TopProduct,
  TopCustomersParams,
  TopCustomer,
  ActivityEvent,
  RecordActivityInput,
  ListActivityParams,
} from './types.js'
