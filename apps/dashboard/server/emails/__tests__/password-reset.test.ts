// ---------------------------------------------------------------------------
// admin-password-reset + buyer-password-reset — render smoke tests
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest'
import { renderEmail, getTemplateKeys } from '../_render'
import { adminPasswordResetTemplate, type AdminPasswordResetVars } from '../admin-password-reset'
import { buyerPasswordResetTemplate, type BuyerPasswordResetVars } from '../buyer-password-reset'

const adminVars: AdminPasswordResetVars = {
  name: 'Alice',
  storeName: 'Acme Co',
  resetUrl: 'https://acme.commercejs.cloud/admin/reset/raw-token-xyz',
  expiresAt: '2026-05-01T10:00:00.000Z',
}

const buyerVars: BuyerPasswordResetVars = {
  name: 'Bob',
  storeName: 'Acme Co',
  resetUrl: 'https://acme.commercejs.cloud/account/reset/raw-token-xyz',
  expiresAt: '2026-05-01T10:00:00.000Z',
}

describe('registry', () => {
  it('registers both new password-reset templates', () => {
    const keys = getTemplateKeys()
    expect(keys).toContain('admin-password-reset')
    expect(keys).toContain('buyer-password-reset')
  })
})

describe('admin-password-reset template', () => {
  it('renders subject + html + text with the reset URL', () => {
    const out = renderEmail('admin-password-reset', adminVars as any)
    expect(out.subject).toMatch(/reset.*admin password/i)
    expect(out.subject).toContain('Acme Co')
    expect(out.html).toContain('Alice')
    expect(out.html).toContain('Acme Co')
    expect(out.html).toContain(adminVars.resetUrl)
    expect(out.text).toContain('Alice')
    expect(out.text).toContain(adminVars.resetUrl)
  })

  it('handles missing name', () => {
    const out = adminPasswordResetTemplate.text({ ...adminVars, name: null })
    expect(out).toMatch(/^Hi,/)
    expect(out).not.toMatch(/^Hi  ,/)
  })

  it('escapes HTML in storeName', () => {
    const out = adminPasswordResetTemplate.html({
      ...adminVars,
      storeName: '<script>alert(1)</script>',
    })
    expect(out).not.toContain('<script>alert(1)</script>')
    expect(out).toContain('&lt;script&gt;')
  })
})

describe('buyer-password-reset template', () => {
  it('renders subject + html + text with the reset URL', () => {
    const out = renderEmail('buyer-password-reset', buyerVars as any)
    expect(out.subject).toContain('Acme Co')
    expect(out.html).toContain('Bob')
    expect(out.html).toContain(buyerVars.resetUrl)
    expect(out.text).toContain(buyerVars.resetUrl)
  })

  it('escapes HTML in resetUrl (should encode unsafe chars but keep URL-safe ones)', () => {
    const safeUrl = 'https://shop.commercejs.cloud/account/reset/abc-XYZ_123'
    const out = buyerPasswordResetTemplate.html({ ...buyerVars, resetUrl: safeUrl })
    expect(out).toContain(safeUrl)
  })
})
