// ---------------------------------------------------------------------------
// Orders domain — order CRUD and status management
// ---------------------------------------------------------------------------

import type {
  Order,
  CreateOrderInput,
  PaginationParams,
  PaginatedResult,
  OrderStatusInfo,
  OrderHistoryEntry,
  UpdateOrderStatusInput,
} from '@commercejs/types'
import {
  createOrder as dbCreateOrder,
  createOrderItem,
  createOrderHistory,
  findOrderById,
  findOrders,
  findOrderItems,
  findOrderHistory,
  updateOrder,
} from '../database/index.js'
import { generateOrderNumber, localized, price, priceRequired, img, parseJsonField, toNumber } from './helpers.js'

export function createOrdersDomain(currency: string) {
  /** Map DB order row + items to unified Order type */
  async function mapOrder(row: any): Promise<Order> {
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
        price: priceRequired(toNumber(i.price), currency),
        totalPrice: priceRequired(toNumber(i.totalPrice), currency),
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
      shippingMethod: row.shippingMethod
        ? (() => { const n = parseJsonField(row.shippingMethod); return { id: 'default', name: typeof n === 'object' ? localized(n.en, n.ar) : localized(n, null), provider: 'custom', fulfillmentType: 'shipping' as const, price: priceRequired(0, currency), estimatedDays: { min: 1, max: 7 }, cashOnDelivery: false } })()
        : null,
      paymentMethod: row.paymentMethod
        ? (() => { const n = parseJsonField(row.paymentMethod); return { id: 'default', type: 'card', name: typeof n === 'object' ? localized(n.en, n.ar) : localized(n, null), provider: 'platform', installments: null, icon: null } })()
        : null,
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
  }

  return {
    async createOrder(input: CreateOrderInput): Promise<Order> {
      const id = crypto.randomUUID()

      const orderNumber = generateOrderNumber()
      const subtotal = input.items.reduce((sum, item) => sum + (item.unitPrice.amount * item.quantity), 0)

      await dbCreateOrder({
        id,
        orderNumber,
        customerId: input.customerId ?? null,
        status: 'pending',
        subtotal,
        total: subtotal,
        currency,
        shippingAddress: input.shippingAddress as any ?? null,
        billingAddress: input.billingAddress as any ?? null,
        note: input.note ?? null,
        requiresShipping: true,
      })

      for (const item of input.items) {
        await createOrderItem({
          orderId: id,
          productId: item.productId,
          variantId: item.variantId ?? null,
          name: 'Product',
          quantity: item.quantity,
          price: item.unitPrice.amount,
          totalPrice: item.unitPrice.amount * item.quantity,
        })
      }

      await createOrderHistory({
        orderId: id,
        toStatus: 'pending',
        note: 'Order created',
      })

      const row = await findOrderById(id)
      return mapOrder(row)
    },

    async getOrder(orderId: string): Promise<Order> {
      const row = await findOrderById(orderId)
      if (!row) throw new Error(`Order not found: ${orderId}`)
      return mapOrder(row)
    },

    async getCustomerOrders(params?: PaginationParams): Promise<PaginatedResult<Order>> {
      const page = params?.page ?? 1
      const perPage = params?.perPage ?? 20
      const offset = (page - 1) * perPage

      const rows = await findOrders({ limit: perPage, offset })
      const orders = await Promise.all(rows.map(mapOrder))

      return {
        items: orders,
        total: orders.length,
        page,
        perPage,
        hasMore: orders.length === perPage,
      }
    },

    async getOrderStatuses(): Promise<OrderStatusInfo[]> {
      const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'returned']
      const colors: Record<string, string> = {
        pending: '#F59E0B', processing: '#3B82F6', shipped: '#8B5CF6',
        delivered: '#10B981', cancelled: '#EF4444', refunded: '#6B7280', returned: '#F97316',
      }
      const icons: Record<string, string> = {
        pending: 'clock', processing: 'refresh', shipped: 'truck',
        delivered: 'check', cancelled: 'x', refunded: 'arrow-left', returned: 'rotate-ccw',
      }

      return statuses.map(s => ({
        id: s,
        name: s.charAt(0).toUpperCase() + s.slice(1),
        slug: s,
        type: 'original' as const,
        color: colors[s] ?? null,
        icon: icons[s] ?? null,
        isActive: true,
        parent: null,
        children: [],
      }))
    },

    async updateOrderStatus(orderId: string, input: UpdateOrderStatusInput): Promise<void> {
      const order = await findOrderById(orderId)
      if (!order) throw new Error(`Order not found: ${orderId}`)

      await updateOrder(orderId, { status: input.status })

      await createOrderHistory({
        orderId,
        fromStatus: order.status,
        toStatus: input.status,
        note: input.note ?? null,
      })
    },

    async cancelOrder(orderId: string, note?: string): Promise<void> {
      return this.updateOrderStatus(orderId, { status: 'cancelled', note: note ?? 'Order cancelled' })
    },

    async duplicateOrder(orderId: string): Promise<Order> {
      const original = await this.getOrder(orderId)
      return this.createOrder({
        customerId: original.customerId ?? undefined,
        shippingAddress: original.shippingAddress as any ?? {
          firstName: '', lastName: '', street: '', city: '', country: '',
        },
        items: original.items.map(i => ({
          productId: i.productId,
          variantId: i.variantId ?? undefined,
          quantity: i.quantity,
          unitPrice: i.price,
        })),
      })
    },

    async getOrderHistory(orderId: string): Promise<OrderHistoryEntry[]> {
      const rows = await findOrderHistory(orderId)

      return rows.map((row: any) => ({
        id: row.id,
        orderId: row.orderId,
        action: row.toStatus,
        note: row.note ?? null,
        createdAt: row.createdAt,
      }))
    },
  }
}
