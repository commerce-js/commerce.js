// ---------------------------------------------------------------------------
// customers domain — password-reset helpers (transactional-emails T02, buyer)
// ---------------------------------------------------------------------------

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createHash } from 'node:crypto'

const mocks = vi.hoisted(() => ({
  findCustomerByEmail: vi.fn(),
  findCustomerById: vi.fn(),
  createCustomer: vi.fn(),
  updateCustomer: vi.fn(),
  findAddresses: vi.fn(),
  findAddressById: vi.fn(),
  createAddress: vi.fn(),
  updateAddress: vi.fn(),
  deleteAddress: vi.fn(),
  createPasswordResetRow: vi.fn(),
  findPasswordResetByTokenHash: vi.fn(),
  markPasswordResetUsed: vi.fn(),
}))

vi.mock('../database/index.js', () => mocks)

import { createCustomersDomain } from '../domains/customers.js'

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset()
  mocks.findAddresses.mockResolvedValue([])
})

const domain = createCustomersDomain()

function sha256Hex(s: string): string {
  return createHash('sha256').update(s).digest('hex')
}

describe('buyer requestPasswordReset', () => {
  it('returns null on empty email (no DB call)', async () => {
    expect(await domain.requestPasswordReset('')).toBeNull()
    expect(mocks.findCustomerByEmail).not.toHaveBeenCalled()
  })

  it('returns null when customer not found', async () => {
    mocks.findCustomerByEmail.mockResolvedValueOnce(null)
    expect(await domain.requestPasswordReset('nobody@example.com')).toBeNull()
    expect(mocks.createPasswordResetRow).not.toHaveBeenCalled()
  })

  it('creates a buyer-actor reset row + returns token when found', async () => {
    mocks.findCustomerByEmail.mockResolvedValueOnce({ id: 'c1', email: 'b@example.com' })
    const result = await domain.requestPasswordReset('b@example.com')
    expect(result).not.toBeNull()
    const row = mocks.createPasswordResetRow.mock.calls[0][0]
    expect(row.actorType).toBe('buyer')
    expect(row.actorId).toBe('c1')
    expect(row.tokenHash).toBe(sha256Hex(result!.token))
  })
})

describe('buyer verifyPasswordResetToken', () => {
  const raw = 'buyer-raw-token'
  const tokenHash = sha256Hex(raw)
  const validRow = () => ({
    id: 'pr_1',
    actorType: 'buyer',
    actorId: 'c1',
    tokenHash,
    emailSnapshot: 'b@example.com',
    expiresAt: new Date(Date.now() + 10_000),
    usedAt: null,
  })

  it('returns snapshot when valid', async () => {
    mocks.findPasswordResetByTokenHash.mockResolvedValueOnce(validRow())
    const r = await domain.verifyPasswordResetToken(raw)
    expect(r?.customerId).toBe('c1')
    expect(r?.email).toBe('b@example.com')
  })

  it('rejects admin-actor token used on buyer endpoint', async () => {
    mocks.findPasswordResetByTokenHash.mockResolvedValueOnce({
      ...validRow(),
      actorType: 'admin',
    })
    expect(await domain.verifyPasswordResetToken(raw)).toBeNull()
  })

  it('returns null when row not found', async () => {
    mocks.findPasswordResetByTokenHash.mockResolvedValueOnce(null)
    expect(await domain.verifyPasswordResetToken(raw)).toBeNull()
  })

  it('returns null when used', async () => {
    mocks.findPasswordResetByTokenHash.mockResolvedValueOnce({
      ...validRow(),
      usedAt: new Date(),
    })
    expect(await domain.verifyPasswordResetToken(raw)).toBeNull()
  })

  it('returns null when expired', async () => {
    mocks.findPasswordResetByTokenHash.mockResolvedValueOnce({
      ...validRow(),
      expiresAt: new Date(Date.now() - 1),
    })
    expect(await domain.verifyPasswordResetToken(raw)).toBeNull()
  })
})

describe('buyer completePasswordReset', () => {
  const raw = 'buyer-complete-token'
  const tokenHash = sha256Hex(raw)
  const validRow = () => ({
    id: 'pr_1',
    actorType: 'buyer',
    actorId: 'c1',
    tokenHash,
    emailSnapshot: 'b@example.com',
    expiresAt: new Date(Date.now() + 10_000),
    usedAt: null,
  })

  it('sets new hash + marks used + returns customer', async () => {
    mocks.findPasswordResetByTokenHash.mockResolvedValueOnce(validRow())
    mocks.markPasswordResetUsed.mockResolvedValueOnce(true)
    mocks.findCustomerById.mockResolvedValueOnce({
      id: 'c1',
      email: 'b@example.com',
      passwordHash: 'new-hash',
      firstName: 'B',
      lastName: null,
      phone: null,
      defaultAddressId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const result = await domain.completePasswordReset(raw, 'strong-pw-12345')
    expect(mocks.markPasswordResetUsed).toHaveBeenCalledWith(tokenHash)
    const [id, patch] = mocks.updateCustomer.mock.calls[0]
    expect(id).toBe('c1')
    expect(typeof patch.passwordHash).toBe('string')
    expect(patch.passwordHash).not.toBe('strong-pw-12345')
    expect(result.email).toBe('b@example.com')
  })

  it('rejects short password before DB', async () => {
    await expect(domain.completePasswordReset(raw, 'short')).rejects.toThrow(/at least 8/i)
    expect(mocks.findPasswordResetByTokenHash).not.toHaveBeenCalled()
  })

  it('rejects cross-actor admin token', async () => {
    mocks.findPasswordResetByTokenHash.mockResolvedValueOnce({
      ...validRow(),
      actorType: 'admin',
    })
    await expect(domain.completePasswordReset(raw, 'strong-pw-12345')).rejects.toThrow(
      /invalid|already been used/i,
    )
    expect(mocks.markPasswordResetUsed).not.toHaveBeenCalled()
  })

  it('rejects race where markPasswordResetUsed returns false', async () => {
    mocks.findPasswordResetByTokenHash.mockResolvedValueOnce(validRow())
    mocks.markPasswordResetUsed.mockResolvedValueOnce(false)
    await expect(domain.completePasswordReset(raw, 'strong-pw-12345')).rejects.toThrow(
      /invalid|already been used/i,
    )
    expect(mocks.updateCustomer).not.toHaveBeenCalled()
  })

  it('rejects expired token', async () => {
    mocks.findPasswordResetByTokenHash.mockResolvedValueOnce({
      ...validRow(),
      expiresAt: new Date(Date.now() - 1),
    })
    await expect(domain.completePasswordReset(raw, 'strong-pw-12345')).rejects.toThrow(
      /invalid|already been used/i,
    )
  })

  it('rejects used token', async () => {
    mocks.findPasswordResetByTokenHash.mockResolvedValueOnce({
      ...validRow(),
      usedAt: new Date(),
    })
    await expect(domain.completePasswordReset(raw, 'strong-pw-12345')).rejects.toThrow(
      /invalid|already been used/i,
    )
  })
})
