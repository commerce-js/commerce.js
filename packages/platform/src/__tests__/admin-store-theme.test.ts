// ---------------------------------------------------------------------------
// admin.getStoreSettings / admin.updateStoreSettings + theme round-trip
// ---------------------------------------------------------------------------
//
// Exercises T12's theme fields in isolation — DB layer mocked so we
// don't stand up Prisma/Drizzle. Verifies:
//   - mapStoreSettings surfaces null theme fields when the row omits them
//   - mapStoreSettings preserves theme fields when the row has them
//   - updateStoreSettings passes every supplied theme field through
//   - Empty string on a theme field clears the column (persisted as null)
//   - Undefined on a theme field leaves it untouched (omitted from update)
//   - The public store domain exposes theme when any token is set,
//     and returns null when every theme column is null (default palette)
// ---------------------------------------------------------------------------

import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  findStoreInfo: vi.fn(),
  createStoreInfo: vi.fn(),
  updateStoreInfo: vi.fn(),
}))

vi.mock('../database/index.js', () => mocks)

import { createAdminStoreDomain } from '../admin/store.js'
import { createStoreDomain } from '../domains/store.js'

beforeEach(() => {
  mocks.findStoreInfo.mockReset()
  mocks.createStoreInfo.mockReset()
  mocks.updateStoreInfo.mockReset()
})

const base = {
  id: 'default',
  name: 'Smoke Store',
  nameAr: null,
  description: null,
  descriptionAr: null,
  logo: null,
  favicon: null,
  currency: 'SAR',
  locale: 'en',
  timezone: 'Asia/Riyadh',
  supportedCurrencies: ['SAR'],
  supportedLocales: ['en'],
  contactEmail: null,
  contactPhone: null,
  address: null,
  socialLinks: null,
}

describe('admin.getStoreSettings — theme mapping', () => {
  const admin = createAdminStoreDomain()

  it('returns null theme fields when the row omits them', async () => {
    mocks.findStoreInfo.mockResolvedValueOnce({ ...base })
    const settings = await admin.getStoreSettings()
    expect(settings.primaryColor).toBeNull()
    expect(settings.accentColor).toBeNull()
    expect(settings.fontFamily).toBeNull()
    expect(settings.heroImageUrl).toBeNull()
    expect(settings.heroHeadingEn).toBeNull()
    expect(settings.heroHeadingAr).toBeNull()
  })

  it('surfaces theme fields when the row has them', async () => {
    mocks.findStoreInfo.mockResolvedValueOnce({
      ...base,
      primaryColor: '#22c55e',
      accentColor: '#f59e0b',
      fontFamily: 'Inter',
      heroImageUrl: 'https://cdn/hero.jpg',
      heroHeadingEn: 'Welcome',
      heroHeadingAr: 'أهلا',
    })
    const settings = await admin.getStoreSettings()
    expect(settings.primaryColor).toBe('#22c55e')
    expect(settings.accentColor).toBe('#f59e0b')
    expect(settings.fontFamily).toBe('Inter')
    expect(settings.heroImageUrl).toBe('https://cdn/hero.jpg')
    expect(settings.heroHeadingEn).toBe('Welcome')
    expect(settings.heroHeadingAr).toBe('أهلا')
  })
})

describe('admin.updateStoreSettings — theme writes', () => {
  const admin = createAdminStoreDomain()

  it('passes every supplied theme field through', async () => {
    mocks.findStoreInfo.mockResolvedValueOnce({
      ...base,
      primaryColor: '#22c55e',
      accentColor: '#f59e0b',
      fontFamily: 'Inter',
      heroImageUrl: 'https://cdn/hero.jpg',
      heroHeadingEn: 'Welcome',
      heroHeadingAr: 'أهلا',
    })

    await admin.updateStoreSettings({
      primaryColor: '#22c55e',
      accentColor: '#f59e0b',
      fontFamily: 'Inter',
      heroImageUrl: 'https://cdn/hero.jpg',
      heroHeadingEn: 'Welcome',
      heroHeadingAr: 'أهلا',
    })

    expect(mocks.updateStoreInfo).toHaveBeenCalledWith('default', {
      primaryColor: '#22c55e',
      accentColor: '#f59e0b',
      fontFamily: 'Inter',
      heroImageUrl: 'https://cdn/hero.jpg',
      heroHeadingEn: 'Welcome',
      heroHeadingAr: 'أهلا',
    })
  })

  it('empty string clears a theme field to null', async () => {
    mocks.findStoreInfo.mockResolvedValueOnce({ ...base })
    await admin.updateStoreSettings({ primaryColor: '', fontFamily: '' })
    expect(mocks.updateStoreInfo).toHaveBeenCalledWith('default', {
      primaryColor: null,
      fontFamily: null,
    })
  })

  it('undefined theme fields are omitted from the update', async () => {
    mocks.findStoreInfo.mockResolvedValueOnce({ ...base })
    await admin.updateStoreSettings({ primaryColor: '#ef4444' })
    expect(mocks.updateStoreInfo).toHaveBeenCalledWith('default', {
      primaryColor: '#ef4444',
    })
    const [, patch] = mocks.updateStoreInfo.mock.calls[0]!
    expect(patch).not.toHaveProperty('accentColor')
    expect(patch).not.toHaveProperty('fontFamily')
    expect(patch).not.toHaveProperty('heroImageUrl')
    expect(patch).not.toHaveProperty('heroHeadingEn')
    expect(patch).not.toHaveProperty('heroHeadingAr')
  })
})

describe('public store domain — StoreInfo.theme', () => {
  const publicDomain = createStoreDomain()

  it('returns null theme when every token is null', async () => {
    mocks.findStoreInfo.mockResolvedValueOnce({ ...base })
    const info = await publicDomain.getStoreInfo()
    expect(info.theme).toBeNull()
  })

  it('returns a theme object when any token is set', async () => {
    mocks.findStoreInfo.mockResolvedValueOnce({
      ...base,
      primaryColor: '#22c55e',
    })
    const info = await publicDomain.getStoreInfo()
    expect(info.theme).toEqual({
      primaryColor: '#22c55e',
      accentColor: null,
      fontFamily: null,
      heroImageUrl: null,
      heroHeadingEn: null,
      heroHeadingAr: null,
    })
  })
})
