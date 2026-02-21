// ---------------------------------------------------------------------------
// Checkout domain — shipping, addresses, and order placement
// ---------------------------------------------------------------------------

import type {
  Cart,
  Order,
  ShippingMethod,
  PaymentMethod,
  Address,
} from '@commercejs/types'
import {
  findCart,
  updateCart,
  deleteCart,
  findProductById,
  createOrder as dbCreateOrder,
  createOrderItem,
  createOrderHistory,
  findOrderById,
  findOrderItems,
} from '../database/index.js'
import { generateOrderNumber, localized, price, priceRequired, img, parseJsonField, toNumber } from './helpers.js'
import { createCartDomain } from './cart.js'

export function createCheckoutDomain(currency: string) {
  const cartDomain = createCartDomain(currency)

  return {
    async getShippingMethods(_cartId: string): Promise<ShippingMethod[]> {
      return [
        {
          id: 'standard',
          name: localized('Standard Shipping', 'شحن عادي'),
          provider: 'custom',
          fulfillmentType: 'shipping' as const,
          price: priceRequired(15, currency),
          estimatedDays: { min: 5, max: 7 },
          cashOnDelivery: false,
        },
        {
          id: 'express',
          name: localized('Express Shipping', 'شحن سريع'),
          provider: 'custom',
          fulfillmentType: 'shipping' as const,
          price: priceRequired(35, currency),
          estimatedDays: { min: 1, max: 2 },
          cashOnDelivery: false,
        },
      ]
    },

    async setShippingAddress(cartId: string, address: Omit<Address, 'id' | 'isDefault'>): Promise<Cart> {
      await updateCart(cartId, { shippingAddress: address as any })
      return cartDomain.getCart(cartId)
    },

    async setBillingAddress(cartId: string, address: Omit<Address, 'id' | 'isDefault'>): Promise<Cart> {
      await updateCart(cartId, { billingAddress: address as any })
      return cartDomain.getCart(cartId)
    },

    async setShippingMethod(cartId: string, methodId: string): Promise<Cart> {
      await updateCart(cartId, { shippingMethodId: methodId })
      return cartDomain.getCart(cartId)
    },

    async getPaymentMethods(_cartId: string): Promise<PaymentMethod[]> {
      return [
        {
          id: 'card',
          type: 'card',
          name: localized('Credit / Debit Card', 'بطاقة ائتمان'),
          provider: 'platform',
          installments: null,
          icon: null,
        },
        {
          id: 'cod',
          type: 'cash_on_delivery',
          name: localized('Cash on Delivery', 'الدفع عند الاستلام'),
          provider: 'platform',
          installments: null,
          icon: null,
        },
      ]
    },

    async setPaymentMethod(cartId: string, methodId: string): Promise<Cart> {
      await updateCart(cartId, { paymentMethodId: methodId })
      return cartDomain.getCart(cartId)
    },

    async placeOrder(cartId: string, options?: { status?: string; keepCart?: boolean }): Promise<Order> {
      const cart = await cartDomain.getCart(cartId)

      if (cart.items.length === 0) {
        throw new Error('Cannot place order with empty cart')
      }

      const orderStatus = options?.status ?? 'pending'

      // Look up selected shipping/payment methods by ID from cart row
      const cartRow = await findCart(cartId)
      const shippingMethods = await this.getShippingMethods(cartId)
      const paymentMethods = await this.getPaymentMethods(cartId)
      const selectedShipping = shippingMethods.find(m => m.id === cartRow?.shippingMethodId) ?? null
      const selectedPayment = paymentMethods.find(m => m.id === cartRow?.paymentMethodId) ?? null


      const orderId = crypto.randomUUID()
      const orderNumber = generateOrderNumber()

      const subtotal = cart.totals.subtotal.amount
      const shippingCost = selectedShipping?.price.amount ?? cart.totals.shipping?.amount ?? 0
      const tax = cart.totals.tax?.amount ?? 0
      const discount = cart.totals.discount?.amount ?? 0
      const total = subtotal + shippingCost + tax - discount

      await dbCreateOrder({
        id: orderId,
        orderNumber,
        customerId: cart.customerId ?? null,
        status: orderStatus,
        subtotal,
        shippingCost,
        tax,
        discount,
        total,
        currency,
        shippingAddress: cart.shippingAddress as any,
        billingAddress: cart.billingAddress as any,
        shippingMethod: selectedShipping?.name ? JSON.stringify(selectedShipping.name) : null,
        paymentMethod: selectedPayment?.name ? JSON.stringify(selectedPayment.name) : null,
        requiresShipping: true,
      })

      for (const item of cart.items) {
        await createOrderItem({
          orderId,
          productId: item.productId,
          variantId: item.variantId ?? null,
          name: typeof item.name === 'object' ? (item.name as any).en : String(item.name),
          quantity: item.quantity,
          price: item.price.amount,
          totalPrice: item.totalPrice.amount,
          productType: 'physical',
          fulfillmentStatus: 'unfulfilled',
        })
      }

      await createOrderHistory({
        orderId,
        fromStatus: null,
        toStatus: orderStatus,
        note: 'Order placed',
      })

      // Only delete cart if not keeping it (COD deletes immediately, card keeps for payment)
      if (!options?.keepCart) {
        await deleteCart(cartId)
      }

      // Build and return the order
      const order = await findOrderById(orderId)
      if (!order) throw new Error(`Order not found after creation: ${orderId}`)
      const items = await findOrderItems(orderId)

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status as any,
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
          subtotal: priceRequired(order.subtotal, currency),
          shipping: price(order.shippingCost, currency),
          tax: price(order.tax, currency),
          discount: price(order.discount, currency),
          total: priceRequired(order.total, currency),
        },
        shippingAddress: parseJsonField(order.shippingAddress),
        billingAddress: parseJsonField(order.billingAddress),
        shippingMethod: order.shippingMethod
          ? (() => { const n = parseJsonField(order.shippingMethod); return { id: 'default', name: typeof n === 'object' ? localized(n.en, n.ar) : localized(n, null), provider: 'custom', fulfillmentType: 'shipping' as const, price: priceRequired(0, currency), estimatedDays: { min: 1, max: 7 }, cashOnDelivery: false } })()
          : null,
        paymentMethod: order.paymentMethod
          ? (() => { const n = parseJsonField(order.paymentMethod); return { id: 'default', type: 'card', name: typeof n === 'object' ? localized(n.en, n.ar) : localized(n, null), provider: 'platform', installments: null, icon: null } })()
          : null,
        trackingNumber: order.trackingNumber ?? null,
        trackingUrl: order.trackingUrl ?? null,
        note: order.note ?? null,
        customerId: order.customerId ?? null,
        requiresShipping: Boolean(order.requiresShipping),
        createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt,
        updatedAt: order.updatedAt instanceof Date ? order.updatedAt.toISOString() : order.updatedAt,
        paymentTerms: null,
        purchaseOrderNumber: null,
        companyName: null,
        giftCardCodesApplied: [],
        giftCardAmountApplied: null,
      }
    },
  }
}
