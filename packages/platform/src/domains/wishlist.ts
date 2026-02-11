// ---------------------------------------------------------------------------
// Wishlist domain — customer wishlists
// ---------------------------------------------------------------------------

import type { Wishlist } from '@commercejs/types'
import {
  findWishlistByCustomer,
  createWishlist as dbCreateWishlist,
  findWishlistItems,
  insertWishlistItem,
  deleteWishlistItem,
  findWishlistItemByProduct,
  findProductById,
} from '../database/index.js'
import { localized, discountablePrice, img } from './helpers.js'

async function getOrCreateWishlist(customerId: string) {
  let wl = await findWishlistByCustomer(customerId)
  if (!wl) {
    wl = await dbCreateWishlist(customerId)
  }
  return wl
}

async function buildWishlist(wishlistId: string): Promise<Wishlist> {
  const items = await findWishlistItems(wishlistId)

  const mapped = await Promise.all(
    items.map(async (item: any) => {
      const product = await findProductById(item.productId)
      return {
        id: item.id,
        product: product
          ? {
              id: product.id,
              name: localized(product.name, product.nameAr),
              slug: product.slug,
              price: discountablePrice(product.price, product.compareAtPrice, product.currency),
              gallery: [],
              inStock: product.inStock,
            }
          : { id: item.productId, name: localized('Unknown', 'غير معروف'), slug: '', price: null, gallery: [], inStock: false },
        variantId: item.variantId ?? null,
        addedAt: item.addedAt,
      }
    }),
  )

  return {
    id: wishlistId,
    items: mapped as any,
    itemCount: mapped.length,
  }
}

export function createWishlistDomain() {
  // Track customer in-session (same pattern as customers domain)
  let currentCustomerId: string | null = null

  return {
    /** Set customer context (called after login) */
    setCustomerId(id: string) {
      currentCustomerId = id
    },

    async getWishlist(customerId?: string): Promise<Wishlist> {
      const cid = customerId ?? currentCustomerId
      if (!cid) throw new Error('Customer ID required for wishlist')
      const wl = await getOrCreateWishlist(cid)
      return buildWishlist(wl.id)
    },

    async addToWishlist(productId: string, variantId?: string, customerId?: string): Promise<Wishlist> {
      const cid = customerId ?? currentCustomerId
      if (!cid) throw new Error('Customer ID required for wishlist')
      const wl = await getOrCreateWishlist(cid)

      // Avoid duplicates
      const existing = await findWishlistItemByProduct(wl.id, productId)
      if (!existing) {
        await insertWishlistItem({ wishlistId: wl.id, productId, variantId })
      }

      return buildWishlist(wl.id)
    },

    async removeFromWishlist(productId: string, customerId?: string): Promise<Wishlist> {
      const cid = customerId ?? currentCustomerId
      if (!cid) throw new Error('Customer ID required for wishlist')
      const wl = await getOrCreateWishlist(cid)
      await deleteWishlistItem(wl.id, productId)
      return buildWishlist(wl.id)
    },
  }
}
