// ---------------------------------------------------------------------------
// Wishlist domain types
// ---------------------------------------------------------------------------

import type { Id, Maybe } from './common.js'
import type { Product } from './product.js'

/** A single item in the wishlist */
export interface WishlistItem {
  id: Id
  product: Product
  /** Optional variant ID if the user favorited a specific variant */
  variantId: Maybe<string>
  addedAt: string
}

/** Wishlist entity */
export interface Wishlist {
  id: Id
  items: WishlistItem[]
  /** Total number of items */
  itemCount: number
}
