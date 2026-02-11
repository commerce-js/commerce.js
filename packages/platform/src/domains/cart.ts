// ---------------------------------------------------------------------------
// Cart domain — cart CRUD and item management
// ---------------------------------------------------------------------------

import type { Cart, AddToCartInput } from '@commercejs/types'
import {
  createCart as dbCreateCart,
  findCart,
  findCartItems,
  findExistingCartItem,
  insertCartItem,
  updateCartItemQuantity,
  deleteCartItem,
  updateCart,
  deleteCart,
  findProductById,
  findVariantById,
  findPrimaryImage,
} from '../database/index.js'
import { localized, discountablePrice, priceRequired, img } from './helpers.js'

export function createCartDomain(currency: string) {
  /** Build a full Cart object from cart row + items + product data */
  async function buildCart(cartId: string): Promise<Cart> {
    const cartRow = await findCart(cartId)
    if (!cartRow) throw new Error(`Cart not found: ${cartId}`)

    const items = await findCartItems(cartId)

    const cartItems = await Promise.all(items.map(async (item: any) => {
      const product = await findProductById(item.productId)
      const primaryImg = await findPrimaryImage(item.productId)

      let itemPrice = product?.price ?? 0
      let compareAt = product?.compareAtPrice ?? null

      if (item.variantId) {
        const variant = await findVariantById(item.variantId)
        if (variant?.price != null) {
          itemPrice = variant.price
          compareAt = variant.compareAtPrice ?? null
        }
      }

      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId ?? null,
        name: product ? localized(product.name, product.nameAr) : localized('Unknown', null),
        image: primaryImg ? img(primaryImg.url, primaryImg.altText) : null,
        quantity: item.quantity,
        price: discountablePrice(itemPrice, compareAt, currency)!,
        totalPrice: priceRequired(itemPrice * item.quantity, currency),
      }
    }))

    const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice.amount, 0)

    return {
      id: cartRow.id,
      items: cartItems,
      totals: {
        subtotal: priceRequired(subtotal, currency),
        shipping: null,
        tax: null,
        discount: null,
        total: priceRequired(subtotal, currency),
      },
      shippingAddress: cartRow.shippingAddress as any ?? null,
      billingAddress: cartRow.billingAddress as any ?? null,
      shippingMethod: null,
      paymentMethod: null,
      couponCode: cartRow.couponCode ?? null,
      customerId: cartRow.customerId ?? null,
      itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      createdAt: cartRow.createdAt,
      updatedAt: cartRow.updatedAt,
    }
  }

  return {
    async createCart(): Promise<Cart> {
      const id = crypto.randomUUID()
      const now = new Date().toISOString()
      await dbCreateCart(id, now)
      return buildCart(id)
    },

    async getCart(cartId: string): Promise<Cart> {
      return buildCart(cartId)
    },

    async addToCart(cartId: string, item: AddToCartInput): Promise<Cart> {
      const existing = await findExistingCartItem(cartId, item.productId, item.variantId)

      if (existing) {
        await updateCartItemQuantity(existing.id, existing.quantity + item.quantity)
      } else {
        await insertCartItem({
          cartId,
          productId: item.productId,
          variantId: item.variantId ?? null,
          quantity: item.quantity,
          createdAt: new Date().toISOString(),
        })
      }

      await updateCart(cartId, { updatedAt: new Date().toISOString() })
      return buildCart(cartId)
    },

    async updateCartItem(cartId: string, itemId: string, quantity: number): Promise<Cart> {
      if (quantity <= 0) {
        await deleteCartItem(itemId)
      } else {
        await updateCartItemQuantity(itemId, quantity)
      }
      await updateCart(cartId, { updatedAt: new Date().toISOString() })
      return buildCart(cartId)
    },

    async removeFromCart(cartId: string, itemId: string): Promise<Cart> {
      await deleteCartItem(itemId)
      await updateCart(cartId, { updatedAt: new Date().toISOString() })
      return buildCart(cartId)
    },

    async applyCoupon(cartId: string, code: string): Promise<Cart> {
      await updateCart(cartId, { couponCode: code, updatedAt: new Date().toISOString() })
      return buildCart(cartId)
    },

    async removeCoupon(cartId: string): Promise<Cart> {
      await updateCart(cartId, { couponCode: null, updatedAt: new Date().toISOString() })
      return buildCart(cartId)
    },
  }
}
