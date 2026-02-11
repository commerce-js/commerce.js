// ---------------------------------------------------------------------------
// Prisma: Cart queries
// ---------------------------------------------------------------------------

import { getDb } from '../client.js'

export async function createCart(id: string, now: string) {
  await getDb().cart.create({ data: { id, createdAt: now, updatedAt: now } })
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
  createdAt: string
}) {
  await getDb().cartItem.create({
    data: {
      cartId: item.cartId,
      productId: item.productId,
      variantId: item.variantId ?? null,
      quantity: item.quantity,
      createdAt: item.createdAt,
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
  // Serialize any object values to JSON strings (e.g., shippingAddress, billingAddress)
  const prismaData: Record<string, any> = {}
  for (const [key, value] of Object.entries(data)) {
    if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
      prismaData[key] = JSON.stringify(value)
    } else {
      prismaData[key] = value
    }
  }
  await getDb().cart.update({ where: { id: cartId }, data: prismaData })
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
