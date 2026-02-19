// ---------------------------------------------------------------------------
// Prisma: Wishlist queries
// ---------------------------------------------------------------------------

import { getDb } from '../client.js'

export async function findWishlistByCustomer(customerId: string) {
  return getDb().wishlist.findFirst({ where: { customerId } })
}

export async function createWishlist(customerId: string) {
  return getDb().wishlist.create({
    data: { customerId },
  })
}

export async function findWishlistItems(wishlistId: string) {
  return getDb().wishlistItem.findMany({ where: { wishlistId } })
}

export async function insertWishlistItem(data: {
  wishlistId: string
  productId: string
  variantId?: string | null
}) {
  return getDb().wishlistItem.create({
    data: {
      wishlistId: data.wishlistId,
      productId: data.productId,
      variantId: data.variantId ?? null,
    },
  })
}

export async function deleteWishlistItem(wishlistId: string, productId: string) {
  // Prisma deleteMany since there's no compound unique key
  await getDb().wishlistItem.deleteMany({
    where: { wishlistId, productId },
  })
}

export async function findWishlistItemByProduct(wishlistId: string, productId: string) {
  return getDb().wishlistItem.findFirst({
    where: { wishlistId, productId },
  })
}
