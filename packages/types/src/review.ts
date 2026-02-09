// ---------------------------------------------------------------------------
// Product review types
// ---------------------------------------------------------------------------

import type { Id, Maybe } from './common.js'

/** A submitted product review */
export interface Review {
  id: Id
  productId: Id
  /** Reviewer name (may be anonymized by platform) */
  authorName: string
  /** Star rating (1–5) */
  rating: number
  title: Maybe<string>
  body: Maybe<string>
  /** Whether the reviewer has verified purchase */
  verified: boolean
  createdAt: string
}

/** Input for submitting a product review */
export interface ReviewInput {
  productId: string
  rating: number
  title?: string
  body?: string
}

/** Aggregated review stats for a product */
export interface ReviewSummary {
  productId: Id
  averageRating: number
  totalCount: number
  /** Breakdown by star: index 0 = 1-star, index 4 = 5-star */
  distribution: [number, number, number, number, number]
}
