// ---------------------------------------------------------------------------
// admin.auth — password-reset helpers (transactional-emails T02, admin side)
// ---------------------------------------------------------------------------

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createHash } from 'node:crypto'

const mocks = vi.hoisted(() => ({
  findAdminByEmail: vi.fn(),
  findAdminById: vi.fn(),
  createAdminUser: vi.fn(),
  updateAdminUser: vi.fn(),
  deleteAdminUser: vi.fn(),
  findAllAdminUsers: vi.fn(),
  countAdminUsers: vi.fn(),
  createStaffInviteRow: vi.fn(),
  findStaffInviteByTokenHash: vi.fn(),
  markStaffInviteUsed: vi.fn(),
  createPasswordResetRow: vi.fn(),
  findPasswordResetByTokenHash: vi.fn(),
  markPasswordResetUsed: vi.fn(),
}))

vi.mock('../database/index.js', () => mocks)

import { createAdminAuthDomain } from '../admin/auth.js'

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset()
})

const domain = createAdminAuthDomain()

function sha256Hex(s: string): string {
  return createHash('sha256').update(s).digest('hex')
}

describe('requestAdminPasswordReset', () => {
  it('returns null when email is empty (no DB call)', async () => {
    const result = await domain.requestAdminPasswordReset('')
    expect(result).toBeNull()
    expect(mocks.findAdminByEmail).not.toHaveBeenCalled()
  })

  it('returns null when admin not found (no enumeration leak)', async () => {
    mocks.findAdminByEmail.mockResolvedValueOnce(null)
    const result = await domain.requestAdminPasswordReset('nobody@example.com')
    expect(result).toBeNull()
    expect(mocks.createPasswordResetRow).not.toHaveBeenCalled()
  })

  it('creates a reset row + returns token when admin exists', async () => {
    mocks.findAdminByEmail.mockResolvedValueOnce({
      id: 'u1',
      email: 'alice@example.com',
    })
    const result = await domain.requestAdminPasswordReset('alice@example.com')
    expect(result).not.toBeNull()
    expect(result!.token).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(result!.token.length).toBeGreaterThanOrEqual(40)
    expect(result!.expiresAt.getTime()).toBeGreaterThan(Date.now())

    expect(mocks.createPasswordResetRow).toHaveBeenCalledTimes(1)
    const row = mocks.createPasswordResetRow.mock.calls[0][0]
    expect(row.actorType).toBe('admin')
    expect(row.actorId).toBe('u1')
    expect(row.emailSnapshot).toBe('alice@example.com')
    // Stored hash, not raw
    expect(row.tokenHash).toBe(sha256Hex(result!.token))
    expect(row.tokenHash).not.toBe(result!.token)
  })
})

describe('verifyAdminPasswordResetToken', () => {
  const raw = 'reset-raw-token'
  const tokenHash = sha256Hex(raw)

  function validRow() {
    return {
      id: 'pr_1',
      actorType: 'admin',
      actorId: 'u1',
      tokenHash,
      emailSnapshot: 'alice@example.com',
      expiresAt: new Date(Date.now() + 10_000),
      usedAt: null,
    }
  }

  it('returns snapshot when valid', async () => {
    mocks.findPasswordResetByTokenHash.mockResolvedValueOnce(validRow())
    const r = await domain.verifyAdminPasswordResetToken(raw)
    expect(r).toEqual({
      adminUserId: 'u1',
      email: 'alice@example.com',
      expiresAt: expect.any(Date),
    })
  })

  it('returns null for empty token', async () => {
    const r = await domain.verifyAdminPasswordResetToken('')
    expect(r).toBeNull()
    expect(mocks.findPasswordResetByTokenHash).not.toHaveBeenCalled()
  })

  it('returns null when row not found', async () => {
    mocks.findPasswordResetByTokenHash.mockResolvedValueOnce(null)
    const r = await domain.verifyAdminPasswordResetToken(raw)
    expect(r).toBeNull()
  })

  it('returns null when used', async () => {
    mocks.findPasswordResetByTokenHash.mockResolvedValueOnce({
      ...validRow(),
      usedAt: new Date(),
    })
    expect(await domain.verifyAdminPasswordResetToken(raw)).toBeNull()
  })

  it('returns null when expired', async () => {
    mocks.findPasswordResetByTokenHash.mockResolvedValueOnce({
      ...validRow(),
      expiresAt: new Date(Date.now() - 1),
    })
    expect(await domain.verifyAdminPasswordResetToken(raw)).toBeNull()
  })

  it('rejects cross-actor tokens (buyer token probed on admin endpoint)', async () => {
    mocks.findPasswordResetByTokenHash.mockResolvedValueOnce({
      ...validRow(),
      actorType: 'buyer',
    })
    expect(await domain.verifyAdminPasswordResetToken(raw)).toBeNull()
  })
})

describe('completeAdminPasswordReset', () => {
  const raw = 'complete-raw-token'
  const tokenHash = sha256Hex(raw)

  function validRow() {
    return {
      id: 'pr_1',
      actorType: 'admin',
      actorId: 'u1',
      tokenHash,
      emailSnapshot: 'alice@example.com',
      expiresAt: new Date(Date.now() + 10_000),
      usedAt: null,
    }
  }

  it('sets the new password + marks used + returns the safe admin', async () => {
    mocks.findPasswordResetByTokenHash.mockResolvedValueOnce(validRow())
    mocks.markPasswordResetUsed.mockResolvedValueOnce(true)
    mocks.findAdminById.mockResolvedValueOnce({
      id: 'u1',
      email: 'alice@example.com',
      passwordHash: 'new-hash',
      name: 'Alice',
      role: 'admin',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const result = await domain.completeAdminPasswordReset(raw, 'strong-pw-12345')

    expect(mocks.markPasswordResetUsed).toHaveBeenCalledWith(tokenHash)
    expect(mocks.updateAdminUser).toHaveBeenCalledTimes(1)
    const [id, patch] = mocks.updateAdminUser.mock.calls[0]
    expect(id).toBe('u1')
    expect(typeof patch.passwordHash).toBe('string')
    expect(patch.passwordHash).not.toBe('strong-pw-12345') // must be hashed
    expect(result.email).toBe('alice@example.com')
  })

  it('rejects short password before touching DB', async () => {
    await expect(domain.completeAdminPasswordReset(raw, 'short')).rejects.toThrow(/at least 8/i)
    expect(mocks.findPasswordResetByTokenHash).not.toHaveBeenCalled()
  })

  it('rejects empty token', async () => {
    await expect(domain.completeAdminPasswordReset('', 'strong-pw-12345')).rejects.toThrow()
    expect(mocks.findPasswordResetByTokenHash).not.toHaveBeenCalled()
  })

  it('rejects missing row', async () => {
    mocks.findPasswordResetByTokenHash.mockResolvedValueOnce(null)
    await expect(domain.completeAdminPasswordReset(raw, 'strong-pw-12345')).rejects.toThrow(
      /invalid|already been used/i,
    )
  })

  it('rejects used token', async () => {
    mocks.findPasswordResetByTokenHash.mockResolvedValueOnce({
      ...validRow(),
      usedAt: new Date(),
    })
    await expect(domain.completeAdminPasswordReset(raw, 'strong-pw-12345')).rejects.toThrow(
      /invalid|already been used/i,
    )
    expect(mocks.markPasswordResetUsed).not.toHaveBeenCalled()
  })

  it('rejects expired token', async () => {
    mocks.findPasswordResetByTokenHash.mockResolvedValueOnce({
      ...validRow(),
      expiresAt: new Date(Date.now() - 1),
    })
    await expect(domain.completeAdminPasswordReset(raw, 'strong-pw-12345')).rejects.toThrow(
      /invalid|already been used/i,
    )
  })

  it('rejects cross-actor token (buyer reset used on admin complete endpoint)', async () => {
    mocks.findPasswordResetByTokenHash.mockResolvedValueOnce({
      ...validRow(),
      actorType: 'buyer',
    })
    await expect(domain.completeAdminPasswordReset(raw, 'strong-pw-12345')).rejects.toThrow(
      /invalid|already been used/i,
    )
    expect(mocks.markPasswordResetUsed).not.toHaveBeenCalled()
  })

  it('rejects when markPasswordResetUsed returns false (race)', async () => {
    mocks.findPasswordResetByTokenHash.mockResolvedValueOnce(validRow())
    mocks.markPasswordResetUsed.mockResolvedValueOnce(false)
    await expect(domain.completeAdminPasswordReset(raw, 'strong-pw-12345')).rejects.toThrow(
      /invalid|already been used/i,
    )
    expect(mocks.updateAdminUser).not.toHaveBeenCalled()
  })
})
