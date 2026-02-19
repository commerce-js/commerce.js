// ---------------------------------------------------------------------------
// Admin: Order management
// ---------------------------------------------------------------------------

import type { Order, PaginatedResult } from '@commercejs/types'
import type { AdminListOrdersParams, FulfillOrderInput } from './types.js'
import {
  findOrderById,
  findOrderItems,
  findAllOrders,
  updateOrderTracking,
  updateOrder,
  createOrderHistory,
} from '../database/index.js'
import { localized, priceRequired, price, img, parseJsonField } from '../domains/helpers.js'

function mapOrder(row: any, items: any[], currency: string): Order {
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
    shippingMethod: row.shippingMethod ? (() => {
      const n = parseJsonField(row.shippingMethod)
      return {
        id: 'default',
        name: typeof n === 'object' ? localized(n.en, n.ar) : localized(n, null),
        provider: 'custom',
        fulfillmentType: 'shipping' as const,
        price: priceRequired(0, currency),
        estimatedDays: { min: 1, max: 7 },
        cashOnDelivery: false,
      }
    })() : null,
    paymentMethod: row.paymentMethod ? (() => {
      const n = parseJsonField(row.paymentMethod)
      return {
        id: 'default',
        type: 'card',
        name: typeof n === 'object' ? localized(n.en, n.ar) : localized(n, null),
        provider: 'platform',
        installments: null,
        icon: null,
      }
    })() : null,
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

export function createAdminOrdersDomain(currency: string) {
  async function fullOrder(id: string): Promise<Order> {
    const row = await findOrderById(id)
    if (!row) throw new Error(`Order not found: ${id}`)
    const items = await findOrderItems(id)
    return mapOrder(row, items, currency)
  }

  return {
    async listOrders(params?: AdminListOrdersParams): Promise<PaginatedResult<Order>> {
      const page = params?.page ?? 1
      const perPage = params?.perPage ?? 20
      const offset = (page - 1) * perPage

      const { rows, total } = await findAllOrders({
        status: params?.status,
        customerId: params?.customerId,
        dateFrom: params?.dateFrom,
        dateTo: params?.dateTo,
        search: params?.search,
        limit: perPage,
        offset,
      })

      const orders = await Promise.all(
        rows.map(async (row) => {
          const items = await findOrderItems(row.id)
          return mapOrder(row, items, currency)
        }),
      )

      return {
        items: orders,
        total,
        page,
        perPage,
        hasMore: offset + perPage < total,
      }
    },

    getOrder: fullOrder,

    async fulfillOrder(id: string, input: FulfillOrderInput): Promise<void> {
      const order = await findOrderById(id)
      if (!order) throw new Error(`Order not found: ${id}`)

      await updateOrderTracking(id, {
        trackingNumber: input.trackingNumber ?? null,
        trackingUrl: input.trackingUrl ?? null,
        status: 'shipped',
      })

      await createOrderHistory({
        orderId: id,
        fromStatus: order.status,
        toStatus: 'shipped',
        note: input.note ?? 'Order fulfilled',
      })
    },

    async refundOrder(id: string, note?: string): Promise<void> {
      const order = await findOrderById(id)
      if (!order) throw new Error(`Order not found: ${id}`)

      await updateOrder(id, { status: 'refunded' })

      await createOrderHistory({
        orderId: id,
        fromStatus: order.status,
        toStatus: 'refunded',
        note: note ?? 'Order refunded',
      })
    },
  }
}
