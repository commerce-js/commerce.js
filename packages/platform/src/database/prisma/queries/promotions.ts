// ---------------------------------------------------------------------------
// Prisma: Promotions queries
// ---------------------------------------------------------------------------

import { getDb } from '../client.js'

export async function findActivePromotions() {
  return getDb().promotion.findMany({ where: { isActive: true } })
}

export async function findCouponByCode(code: string) {
  return getDb().coupon.findFirst({ where: { code } })
}

export async function findPromotionById(id: string) {
  return getDb().promotion.findFirst({ where: { id } })
}

export async function insertPromotion(data: {
  name: string
  nameAr?: string | null
  discountType: string
  discountValue: number
  target: string
  startsAt: string
  endsAt?: string | null
  isActive?: boolean
}) {
  return getDb().promotion.create({
    data: {
      name: data.name,
      nameAr: data.nameAr ?? null,
      discountType: data.discountType,
      discountValue: data.discountValue,
      target: data.target,
      startsAt: data.startsAt,
      endsAt: data.endsAt ?? null,
      isActive: data.isActive ?? true,
    },
  })
}
