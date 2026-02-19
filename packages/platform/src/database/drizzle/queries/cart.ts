// ---------------------------------------------------------------------------
// Drizzle: Cart queries
// ---------------------------------------------------------------------------

import { eq, and, sql } from 'drizzle-orm'
import { getDb } from '../client.js'
import * as schema from '../schema/index.js'

export async function createCart(id: string, now?: string | Date) {
  const values: any = { id }
  if (now) {
    const ts = now instanceof Date ? now : new Date(now)
    values.createdAt = ts
    values.updatedAt = ts
  }
  await getDb().insert(schema.carts).values(values)
}

export async function findCart(cartId: string) {
  const [row] = await getDb().select().from(schema.carts).where(eq(schema.carts.id, cartId))
  return row ?? null
}

export async function findCartItems(cartId: string) {
  return getDb().select().from(schema.cartItems).where(eq(schema.cartItems.cartId, cartId))
}

export async function findExistingCartItem(cartId: string, productId: string, variantId?: string | null) {
  const [existing] = await getDb().select().from(schema.cartItems)
    .where(and(
      eq(schema.cartItems.cartId, cartId),
      eq(schema.cartItems.productId, productId),
      variantId
        ? eq(schema.cartItems.variantId, variantId)
        : sql`${schema.cartItems.variantId} IS NULL`
    ))
  return existing ?? null
}

export async function insertCartItem(item: {
  cartId: string
  productId: string
  variantId?: string | null
  quantity: number
  createdAt?: string | Date
}) {
  const values: any = {
    cartId: item.cartId,
    productId: item.productId,
    variantId: item.variantId ?? null,
    quantity: item.quantity,
  }
  if (item.createdAt) {
    values.createdAt = item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt)
  }
  await getDb().insert(schema.cartItems).values(values)
}

export async function updateCartItemQuantity(itemId: string, quantity: number) {
  await getDb().update(schema.cartItems).set({ quantity }).where(eq(schema.cartItems.id, itemId))
}

export async function deleteCartItem(itemId: string) {
  await getDb().delete(schema.cartItems).where(eq(schema.cartItems.id, itemId))
}

export async function updateCart(cartId: string, data: Record<string, any>) {
  await getDb().update(schema.carts).set(data).where(eq(schema.carts.id, cartId))
}

export async function deleteCart(cartId: string) {
  await getDb().delete(schema.carts).where(eq(schema.carts.id, cartId))
}

// Cart also needs product lookups for price resolution
export { findProductById } from './catalog.js'

export async function findVariantById(variantId: string) {
  const [row] = await getDb().select().from(schema.productVariants).where(eq(schema.productVariants.id, variantId))
  return row ?? null
}

export async function findPrimaryImage(productId: string) {
  const [row] = await getDb().select().from(schema.productImages)
    .where(and(eq(schema.productImages.productId, productId), eq(schema.productImages.isPrimary, true)))
    .limit(1)
  return row ?? null
}
