// ---------------------------------------------------------------------------
// Salla → Review mapper
// ---------------------------------------------------------------------------

import type { Review } from '@commercejs/types'
import type { SallaRawReview } from '../types.js'

/** Map Salla raw review → unified Review */
export function mapSallaReview(raw: SallaRawReview): Review {
  return {
    id: String(raw.id),
    productId: String(raw.product_id),
    rating: raw.rating,
    title: null, // Salla reviews don't have titles
    body: raw.content,
    authorName: raw.customer?.name ?? 'Anonymous',
    verified: true, // Salla only allows verified purchase reviews
    createdAt: raw.created_at,
  }
}
