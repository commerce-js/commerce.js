// ---------------------------------------------------------------------------
// Cart queries
// ---------------------------------------------------------------------------

import type { PrismaDatabase } from '../prisma/client.js'

const cartInclude = {
  items: {
    include: {
      product: {
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          variants: true,
        },
      },
      variant: true,
    },
    orderBy: { createdAt: 'asc' as const },
  },
} as const

export function createCart(db: PrismaDatabase, customerId?: string) {
  return db.cart.create({
    data: { ...(customerId && { customerId }) },
    include: cartInclude,
  })
}

export function findCart(db: PrismaDatabase, id: string) {
  return db.cart.findUnique({
    where: { id },
    include: cartInclude,
  })
}

export function findOrCreateCart(db: PrismaDatabase, id: string | undefined, customerId?: string) {
  if (id) return findCart(db, id)
  return createCart(db, customerId)
}

export function addCartItem(
  db: PrismaDatabase,
  cartId: string,
  productId: string,
  quantity: number,
  variantId?: string,
) {
  return db.cartItem.create({
    data: {
      cartId,
      productId,
      quantity,
      ...(variantId && { variantId }),
    },
    include: {
      product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
      variant: true,
    },
  })
}

export function updateCartItem(db: PrismaDatabase, cartItemId: string, quantity: number) {
  return db.cartItem.update({
    where: { id: cartItemId },
    data: { quantity },
  })
}

export function removeCartItem(db: PrismaDatabase, cartItemId: string) {
  return db.cartItem.delete({ where: { id: cartItemId } })
}

export function clearCart(db: PrismaDatabase, cartId: string) {
  return db.cartItem.deleteMany({ where: { cartId } })
}

export function updateCartAddresses(
  db: PrismaDatabase,
  cartId: string,
  data: {
    shippingAddress?: object
    billingAddress?: object
    shippingMethodId?: string
    paymentMethodId?: string
    couponCode?: string | null
  },
) {
  return db.cart.update({
    where: { id: cartId },
    data,
    include: cartInclude,
  })
}

export function assignCartToCustomer(db: PrismaDatabase, cartId: string, customerId: string) {
  return db.cart.update({
    where: { id: cartId },
    data: { customerId },
  })
}

export function deleteCart(db: PrismaDatabase, cartId: string) {
  return db.cart.delete({ where: { id: cartId } })
}
