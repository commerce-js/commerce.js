// ---------------------------------------------------------------------------
// Reviews domain — product reviews and ratings
// ---------------------------------------------------------------------------

import type { Review, ReviewSummary, PaginatedResult } from '@commercejs/types'
import {
  findReviewsByProduct,
  getReviewSummaryByProduct,
  getReviewDistribution,
  insertReview,
} from '../database/index.js'

export function createReviewsDomain() {
  return {
    async getProductReviews(productId: string, params?: { page?: number; perPage?: number }): Promise<PaginatedResult<Review>> {
      const rows = await findReviewsByProduct(productId)
      const items = rows.map((r: any) => ({
        id: r.id,
        productId: r.productId,
        authorName: r.authorName,
        rating: r.rating,
        title: r.title ?? null,
        body: r.body ?? null,
        verified: Boolean(r.verified),
        createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
      }))

      const page = params?.page ?? 1
      const perPage = params?.perPage ?? 25
      const start = (page - 1) * perPage
      const paged = items.slice(start, start + perPage)

      return {
        items: paged,
        total: items.length,
        page,
        perPage,
        hasMore: start + perPage < items.length,
      }
    },

    async getReviewSummary(productId: string): Promise<ReviewSummary> {
      const [summary, distribution] = await Promise.all([
        getReviewSummaryByProduct(productId),
        getReviewDistribution(productId),
      ])
      return {
        productId,
        averageRating: Math.round(summary.averageRating * 10) / 10,
        totalCount: summary.totalReviews,
        distribution,
      }
    },

    async submitReview(data: {
      productId: string
      authorName: string
      rating: number
      title?: string
      body?: string
    }): Promise<Review> {
      await insertReview(data)
      const reviews = await findReviewsByProduct(data.productId)
      const latest = reviews[0]
      return {
        id: latest.id,
        productId: latest.productId,
        authorName: latest.authorName,
        rating: latest.rating,
        title: latest.title ?? null,
        body: latest.body ?? null,
        verified: Boolean(latest.verified),
        createdAt: latest.createdAt instanceof Date ? latest.createdAt.toISOString() : latest.createdAt,
      }
    },
  }
}
