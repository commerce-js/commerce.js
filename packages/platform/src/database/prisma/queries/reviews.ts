// ---------------------------------------------------------------------------
// Prisma: Reviews queries
// ---------------------------------------------------------------------------

import { getDb } from '../client.js'

export async function findReviewsByProduct(productId: string) {
  return getDb().review.findMany({
    where: { productId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getReviewSummaryByProduct(productId: string) {
  const result = await getDb().review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: true,
  })
  return {
    averageRating: result._avg.rating ?? 0,
    totalReviews: result._count,
  }
}

export async function getReviewDistribution(productId: string): Promise<[number, number, number, number, number]> {
  const groups = await getDb().review.groupBy({
    by: ['rating'],
    where: { productId },
    _count: true,
  })
  const dist: [number, number, number, number, number] = [0, 0, 0, 0, 0]
  for (const g of groups) {
    if (g.rating >= 1 && g.rating <= 5) {
      dist[g.rating - 1] = g._count
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
  await getDb().review.create({
    data: {
      productId: data.productId,
      authorName: data.authorName,
      rating: data.rating,
      title: data.title ?? null,
      body: data.body ?? null,
      verified: data.verified ?? false,
      status: 'published',
    },
  })
}
