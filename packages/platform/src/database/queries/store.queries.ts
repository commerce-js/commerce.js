// ---------------------------------------------------------------------------
// Store queries — single-row store config
// ---------------------------------------------------------------------------

import type { PrismaDatabase } from '../prisma/client.js'

export type StoreInfoUpdateData = Partial<{
  name: string
  nameAr: string
  description: string
  descriptionAr: string
  logo: string
  favicon: string
  currency: string
  locale: string
  supportedCurrencies: string[]
  supportedLocales: string[]
  timezone: string
  contactEmail: string
  contactPhone: string
  address: string
  socialLinks: Record<string, string>
}>

/**
 * Get the store config row, creating a default one if it doesn't exist.
 * The store row is always id="default" — single-row pattern.
 */
export function getStoreInfo(db: PrismaDatabase) {
  return db.storeInfo.upsert({
    where: { id: 'default' },
    create: { id: 'default' },
    update: {},
  })
}

export function updateStoreInfo(db: PrismaDatabase, data: StoreInfoUpdateData) {
  return db.storeInfo.upsert({
    where: { id: 'default' },
    create: { id: 'default', ...data },
    update: data,
  })
}
