// ---------------------------------------------------------------------------
// Drizzle: Reviews queries
// ---------------------------------------------------------------------------

import { eq, avg, count, asc, desc } from 'drizzle-orm'
import { getDb } from '../client.js'
import * as schema from '../schema/index.js'

export async function findReviewsByProduct(productId: string) {
  return getDb().select().from(schema.reviews)
    .where(eq(schema.reviews.productId, productId))
    .orderBy(desc(schema.reviews.createdAt))
}

export async function getReviewSummaryByProduct(productId: string) {
  const rows = await getDb().select({
    avgRating: avg(schema.reviews.rating),
    totalCount: count(),
  })
    .from(schema.reviews)
    .where(eq(schema.reviews.productId, productId))

  const row = rows[0]
  return {
    averageRating: row?.avgRating ? Number(row.avgRating) : 0,
    totalReviews: row?.totalCount ?? 0,
  }
}

export async function getReviewDistribution(productId: string): Promise<[number, number, number, number, number]> {
  const rows = await getDb().select({
    rating: schema.reviews.rating,
    count: count(),
  })
    .from(schema.reviews)
    .where(eq(schema.reviews.productId, productId))
    .groupBy(schema.reviews.rating)

  const dist: [number, number, number, number, number] = [0, 0, 0, 0, 0]
  for (const row of rows) {
    if (row.rating >= 1 && row.rating <= 5) {
      dist[row.rating - 1] = row.count
    }
  }
  return dist
}

export async function insertReview(data: {
  productId: string
  authorName: string
  rating: number
  title?: string | null
  body?: string | null
  verified?: boolean
}) {
  const id = crypto.randomUUID()
  await getDb().insert(schema.reviews).values({
    id,
    productId: data.productId,
    authorName: data.authorName,
    rating: data.rating,
    title: data.title ?? null,
    body: data.body ?? null,
    verified: data.verified ?? false,
    status: 'published',
  })
  return id
}
