// ---------------------------------------------------------------------------
// Drizzle: Wishlist queries
// ---------------------------------------------------------------------------

import { eq, and } from 'drizzle-orm'
import { getDb } from '../client.js'
import * as schema from '../schema/index.js'

export async function findWishlistByCustomer(customerId: string) {
  const [row] = await getDb().select().from(schema.wishlists)
    .where(eq(schema.wishlists.customerId, customerId))
  return row ?? null
}

export async function createWishlist(customerId: string) {
  const id = crypto.randomUUID()
  await getDb().insert(schema.wishlists).values({ id, customerId })
  return { id, customerId, createdAt: new Date() }
}

export async function findWishlistItems(wishlistId: string) {
  return getDb().select().from(schema.wishlistItems)
    .where(eq(schema.wishlistItems.wishlistId, wishlistId))
}

export async function insertWishlistItem(data: {
  wishlistId: string
  productId: string
  variantId?: string | null
}) {
  const id = crypto.randomUUID()
  await getDb().insert(schema.wishlistItems).values({
    id,
    wishlistId: data.wishlistId,
    productId: data.productId,
    variantId: data.variantId ?? null,
  })
  return id
}

export async function deleteWishlistItem(wishlistId: string, productId: string) {
  await getDb().delete(schema.wishlistItems)
    .where(and(
      eq(schema.wishlistItems.wishlistId, wishlistId),
      eq(schema.wishlistItems.productId, productId),
    ))
}

export async function findWishlistItemByProduct(wishlistId: string, productId: string) {
  const [row] = await getDb().select().from(schema.wishlistItems)
    .where(and(
      eq(schema.wishlistItems.wishlistId, wishlistId),
      eq(schema.wishlistItems.productId, productId),
    ))
  return row ?? null
}
