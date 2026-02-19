// ---------------------------------------------------------------------------
// Prisma: Cart queries
// ---------------------------------------------------------------------------

import { getDb } from '../client.js'

export async function createCart(id: string) {
  await getDb().cart.create({ data: { id } })
}

export async function findCart(cartId: string) {
  return getDb().cart.findUnique({ where: { id: cartId } })
}

export async function findCartItems(cartId: string) {
  return getDb().cartItem.findMany({ where: { cartId } })
}

export async function findExistingCartItem(cartId: string, productId: string, variantId?: string | null) {
  return getDb().cartItem.findFirst({
    where: {
      cartId,
      productId,
      variantId: variantId ?? null,
    },
  })
}

export async function insertCartItem(item: {
  cartId: string
  productId: string
  variantId?: string | null
  quantity: number
}) {
  await getDb().cartItem.create({
    data: {
      cartId: item.cartId,
      productId: item.productId,
      variantId: item.variantId ?? null,
      quantity: item.quantity,
    },
  })
}

export async function updateCartItemQuantity(itemId: string, quantity: number) {
  await getDb().cartItem.update({ where: { id: itemId }, data: { quantity } })
}

export async function deleteCartItem(itemId: string) {
  await getDb().cartItem.delete({ where: { id: itemId } })
}

export async function updateCart(cartId: string, data: Record<string, any>) {
  // With native Json type, Prisma handles object serialization directly
  await getDb().cart.update({ where: { id: cartId }, data })
}

export async function deleteCart(cartId: string) {
  // Delete items first, then cart
  await getDb().cartItem.deleteMany({ where: { cartId } })
  await getDb().cart.delete({ where: { id: cartId } })
}

// Cart also needs product lookups for price resolution
export { findProductById } from './catalog.js'

export async function findVariantById(variantId: string) {
  return getDb().productVariant.findUnique({ where: { id: variantId } })
}

export async function findPrimaryImage(productId: string) {
  return getDb().productImage.findFirst({
    where: { productId, isPrimary: true },
  })
}
