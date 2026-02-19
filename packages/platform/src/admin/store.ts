// ---------------------------------------------------------------------------
// Admin: Store settings management
// ---------------------------------------------------------------------------

import type { StoreSettings, UpdateStoreInput } from './types.js'
import {
  findStoreInfo,
  createStoreInfo as dbCreateStoreInfo,
  updateStoreInfo,
} from '../database/index.js'

function mapStoreSettings(row: any): StoreSettings {
  let supportedCurrencies: string[] = ['SAR']
  let supportedLocales: string[] = ['en']
  let socialLinks: Record<string, string> | null = null

  try {
    if (row.supportedCurrencies) {
      supportedCurrencies = Array.isArray(row.supportedCurrencies)
        ? row.supportedCurrencies
        : typeof row.supportedCurrencies === 'string'
          ? JSON.parse(row.supportedCurrencies)
          : [row.currency]
    }
    if (row.supportedLocales) {
      supportedLocales = Array.isArray(row.supportedLocales)
        ? row.supportedLocales
        : typeof row.supportedLocales === 'string'
          ? JSON.parse(row.supportedLocales)
          : [row.locale]
    }
    if (row.socialLinks) {
      socialLinks = typeof row.socialLinks === 'object' && !Array.isArray(row.socialLinks)
        ? row.socialLinks
        : typeof row.socialLinks === 'string'
          ? JSON.parse(row.socialLinks)
          : null
    }
  } catch {}

  return {
    name: row.name,
    nameAr: row.nameAr ?? null,
    description: row.description ?? null,
    descriptionAr: row.descriptionAr ?? null,
    logo: row.logo ?? null,
    favicon: row.favicon ?? null,
    currency: row.currency,
    locale: row.locale,
    timezone: row.timezone,
    supportedCurrencies,
    supportedLocales,
    contactEmail: row.contactEmail ?? null,
    contactPhone: row.contactPhone ?? null,
    address: row.address ?? null,
    socialLinks,
  }
}

export function createAdminStoreDomain() {
  return {
    async getStoreSettings(): Promise<StoreSettings> {
      let row = await findStoreInfo('default')

      if (!row) {
        await dbCreateStoreInfo({
          id: 'default',
          name: 'My Store',
          currency: 'SAR',
          locale: 'en',
          timezone: 'Asia/Riyadh',
        })
        row = await findStoreInfo('default')
      }

      if (!row) throw new Error('Failed to initialize store info')
      return mapStoreSettings(row)
    },

    async updateStoreSettings(input: UpdateStoreInput): Promise<StoreSettings> {
      const updates: Record<string, unknown> = {}

      if (input.name != null) updates.name = input.name
      if (input.nameAr !== undefined) updates.nameAr = input.nameAr
      if (input.description !== undefined) updates.description = input.description
      if (input.descriptionAr !== undefined) updates.descriptionAr = input.descriptionAr
      if (input.logo !== undefined) updates.logo = input.logo
      if (input.favicon !== undefined) updates.favicon = input.favicon
      if (input.currency != null) updates.currency = input.currency
      if (input.locale != null) updates.locale = input.locale
      if (input.timezone != null) updates.timezone = input.timezone
      if (input.contactEmail !== undefined) updates.contactEmail = input.contactEmail
      if (input.contactPhone !== undefined) updates.contactPhone = input.contactPhone
      if (input.address !== undefined) updates.address = input.address
      if (input.socialLinks !== undefined) updates.socialLinks = input.socialLinks

      await updateStoreInfo('default', updates)

      return this.getStoreSettings()
    },
  }
}
