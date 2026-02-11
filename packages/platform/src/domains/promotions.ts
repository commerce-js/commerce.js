// ---------------------------------------------------------------------------
// Promotions domain — discounts and coupons
// ---------------------------------------------------------------------------

import type { Promotion, Coupon } from '@commercejs/types'
import {
  findActivePromotions,
  findCouponByCode,
  findPromotionById,
} from '../database/index.js'
import { localized } from './helpers.js'

function mapPromotion(row: any): Promotion {
  const conditions = row.conditionsJson ? JSON.parse(row.conditionsJson) : {
    minPurchaseAmount: null,
    minItemCount: null,
    productIds: null,
    categoryIds: null,
    firstOrderOnly: false,
  }

  return {
    id: row.id,
    name: localized(row.name, row.nameAr),
    description: row.description ? localized(row.description, row.descriptionAr) : null,
    discountType: row.discountType as any,
    discountValue: row.discountValue,
    currency: row.currency ?? null,
    maxDiscount: row.maxDiscount ? { amount: row.maxDiscount, currency: row.currency ?? 'SAR', formatted: `${row.maxDiscount} ${row.currency ?? 'SAR'}` } : null,
    target: row.target as any,
    conditions,
    startsAt: row.startsAt,
    endsAt: row.endsAt ?? null,
    isActive: Boolean(row.isActive),
    requiresCoupon: Boolean(row.requiresCoupon),
    usageLimitPerCustomer: row.usageLimitPerCustomer ?? null,
    usageLimitTotal: row.usageLimitTotal ?? null,
  }
}

export function createPromotionsDomain() {
  return {
    async getActivePromotions(): Promise<Promotion[]> {
      const rows = await findActivePromotions()
      return rows.map(mapPromotion)
    },

    async validateCoupon(code: string): Promise<Coupon | null> {
      const couponRow = await findCouponByCode(code)
      if (!couponRow) return null

      const promoRow = await findPromotionById(couponRow.promotionId)
      if (!promoRow) return null

      return {
        id: couponRow.id,
        code: couponRow.code,
        promotion: mapPromotion(promoRow),
        isValid: Boolean(couponRow.isValid),
        invalidReason: couponRow.invalidReason ?? null,
        timesUsed: couponRow.timesUsed,
      }
    },
  }
}
