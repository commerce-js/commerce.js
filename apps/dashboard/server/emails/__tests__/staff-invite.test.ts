// ---------------------------------------------------------------------------
// staff-invite template — render smoke tests
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest'
import { renderEmail, getTemplateKeys } from '../_render'
import { staffInviteTemplate, type StaffInviteVars } from '../staff-invite'

const baseVars: StaffInviteVars = {
  name: 'Alice',
  storeName: 'Acme Co',
  inviteUrl: 'https://acme.commercejs.cloud/admin/invite/raw-token-abc',
  expiresAt: '2026-05-01T10:00:00.000Z',
  inviterName: 'Baker',
}

describe('renderEmail', () => {
  it('registers the staff-invite template', () => {
    expect(getTemplateKeys()).toContain('staff-invite')
  })

  it('throws on an unknown template key', () => {
    expect(() => renderEmail('does-not-exist', {})).toThrow(/Unknown email template/i)
  })

  it('produces subject + html + text for staff-invite', () => {
    const out = renderEmail('staff-invite', baseVars as any)
    expect(out.subject).toContain('Acme Co')
    expect(out.subject).toContain('CommerceJS Cloud')
    expect(out.html).toContain('Alice')
    expect(out.html).toContain('Acme Co')
    expect(out.html).toContain('Baker')
    expect(out.html).toContain('https://acme.commercejs.cloud/admin/invite/raw-token-abc')
    expect(out.text).toContain('Alice')
    expect(out.text).toContain('https://acme.commercejs.cloud/admin/invite/raw-token-abc')
  })
})

describe('staff-invite template', () => {
  it('handles missing name — no trailing whitespace in greeting', () => {
    const out = staffInviteTemplate.text({ ...baseVars, name: null })
    expect(out).toMatch(/^Hi,/)
    expect(out).not.toMatch(/^Hi  ,/)
  })

  it('escapes HTML in vars to prevent injection', () => {
    const out = staffInviteTemplate.html({
      ...baseVars,
      storeName: '<script>alert(1)</script>',
    })
    expect(out).not.toContain('<script>alert(1)</script>')
    expect(out).toContain('&lt;script&gt;')
  })

  it('subject is stable across calls (template owns it)', () => {
    const a = staffInviteTemplate.subject(baseVars)
    const b = staffInviteTemplate.subject(baseVars)
    expect(a).toBe(b)
  })

  it('inviteUrl round-trips unchanged (escaped but recoverable)', () => {
    const url = 'https://smoke.commercejs.cloud/admin/invite/abc-XYZ_123'
    const out = staffInviteTemplate.html({ ...baseVars, inviteUrl: url })
    // URL characters are safe; they should appear verbatim.
    expect(out).toContain(url)
  })
})
