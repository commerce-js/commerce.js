// ---------------------------------------------------------------------------
// admin.auth — staff invite helpers (transactional-emails T01)
// ---------------------------------------------------------------------------
//
// Exercises createAdmin(sendInvite), verifyStaffInviteToken, acceptStaffInvite,
// and the login() null-password-hash guard in isolation. DB layer is mocked
// so no Prisma/Drizzle is stood up.
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

describe('login — null password_hash guard', () => {
  it('rejects an invited-state row without calling bcrypt.compare', async () => {
    mocks.findAdminByEmail.mockResolvedValueOnce({
      id: 'u1',
      email: 'alice@example.com',
      passwordHash: null, // invited row
      role: 'admin',
      status: 'invited',
    })
    await expect(domain.login('alice@example.com', 'anything')).rejects.toThrow(
      /pending invite/i,
    )
  })

  it('still rejects unknown email with the generic error', async () => {
    mocks.findAdminByEmail.mockResolvedValueOnce(null)
    await expect(domain.login('nobody@example.com', 'x')).rejects.toThrow(
      /invalid email or password/i,
    )
  })
})

describe('createAdmin — password required when sendInvite is false', () => {
  it('throws when no password and sendInvite is undefined', async () => {
    mocks.findAdminByEmail.mockResolvedValueOnce(null)
    await expect(domain.createAdmin({ email: 'a@b.com' } as any))
      .rejects.toThrow(/password is required/i)
  })

  it('throws when no password and sendInvite=false', async () => {
    mocks.findAdminByEmail.mockResolvedValueOnce(null)
    await expect(domain.createAdmin({ email: 'a@b.com', sendInvite: false } as any))
      .rejects.toThrow(/password is required/i)
  })

  it('returns { admin, invite: null } on the classic password path', async () => {
    mocks.findAdminByEmail.mockResolvedValueOnce(null)
    mocks.findAdminById.mockResolvedValueOnce({
      id: 'u1',
      email: 'a@b.com',
      passwordHash: 'hashed',
      name: null,
      role: 'admin',
      status: 'active',
      createdAt: new Date('2026-04-20'),
      updatedAt: new Date('2026-04-20'),
    })
    const result = await domain.createAdmin({ email: 'a@b.com', password: 'secret123' })
    expect(result.invite).toBeNull()
    expect(result.admin.email).toBe('a@b.com')
    expect(mocks.createStaffInviteRow).not.toHaveBeenCalled()
  })
})

describe('createAdmin({ sendInvite: true }) — invited state', () => {
  beforeEach(() => {
    mocks.findAdminByEmail.mockResolvedValueOnce(null)
    mocks.findAdminById.mockResolvedValueOnce({
      id: 'u1',
      email: 'alice@example.com',
      passwordHash: null,
      name: 'Alice',
      role: 'admin',
      status: 'invited',
      createdAt: new Date('2026-04-21'),
      updatedAt: new Date('2026-04-21'),
    })
  })

  it('creates the row with status=invited and no password', async () => {
    const result = await domain.createAdmin({
      email: 'alice@example.com',
      name: 'Alice',
      sendInvite: true,
    })
    expect(mocks.createAdminUser).toHaveBeenCalledTimes(1)
    const insertedRow = mocks.createAdminUser.mock.calls[0][0]
    expect(insertedRow.passwordHash).toBeNull()
    expect(insertedRow.status).toBe('invited')
    expect(insertedRow.email).toBe('alice@example.com')
    expect(result.admin.status).toBe('invited')
  })

  it('writes a staff_invites row and returns the raw token once', async () => {
    const result = await domain.createAdmin({
      email: 'alice@example.com',
      sendInvite: true,
    })
    expect(result.invite).not.toBeNull()
    expect(result.invite!.token).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(result.invite!.token.length).toBeGreaterThanOrEqual(40)
    expect(result.invite!.expiresAt.getTime()).toBeGreaterThan(Date.now())

    expect(mocks.createStaffInviteRow).toHaveBeenCalledTimes(1)
    const inviteRow = mocks.createStaffInviteRow.mock.calls[0][0]
    // adminUserId on the invite row matches the fresh UUID assigned to the
    // admin_users insert (crypto.randomUUID() is deterministic-within-call,
    // so the two writes agree).
    const createdRow = mocks.createAdminUser.mock.calls[0][0]
    expect(inviteRow.adminUserId).toBe(createdRow.id)
    expect(inviteRow.emailSnapshot).toBe('alice@example.com')
    // Stored value is the sha256 hash, not the raw token.
    expect(inviteRow.tokenHash).toBe(sha256Hex(result.invite!.token))
    expect(inviteRow.tokenHash).not.toBe(result.invite!.token)
  })
})

describe('verifyStaffInviteToken', () => {
  const raw = 'abc123token'
  const tokenHash = sha256Hex(raw)

  it('returns snapshot when token is valid', async () => {
    mocks.findStaffInviteByTokenHash.mockResolvedValueOnce({
      id: 'inv_1',
      adminUserId: 'u1',
      tokenHash,
      emailSnapshot: 'alice@example.com',
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
    })
    const result = await domain.verifyStaffInviteToken(raw)
    expect(result).toEqual({
      adminUserId: 'u1',
      email: 'alice@example.com',
      expiresAt: expect.any(Date),
    })
    expect(mocks.findStaffInviteByTokenHash).toHaveBeenCalledWith(tokenHash)
  })

  it('returns null when empty token', async () => {
    const result = await domain.verifyStaffInviteToken('')
    expect(result).toBeNull()
    expect(mocks.findStaffInviteByTokenHash).not.toHaveBeenCalled()
  })

  it('returns null when row not found', async () => {
    mocks.findStaffInviteByTokenHash.mockResolvedValueOnce(null)
    const result = await domain.verifyStaffInviteToken(raw)
    expect(result).toBeNull()
  })

  it('returns null when already used', async () => {
    mocks.findStaffInviteByTokenHash.mockResolvedValueOnce({
      adminUserId: 'u1',
      tokenHash,
      emailSnapshot: 'alice@example.com',
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: new Date(),
    })
    const result = await domain.verifyStaffInviteToken(raw)
    expect(result).toBeNull()
  })

  it('returns null when expired', async () => {
    mocks.findStaffInviteByTokenHash.mockResolvedValueOnce({
      adminUserId: 'u1',
      tokenHash,
      emailSnapshot: 'alice@example.com',
      expiresAt: new Date(Date.now() - 1_000),
      usedAt: null,
    })
    const result = await domain.verifyStaffInviteToken(raw)
    expect(result).toBeNull()
  })
})

describe('acceptStaffInvite', () => {
  const raw = 'accepttoken'
  const tokenHash = sha256Hex(raw)

  function validRow() {
    return {
      id: 'inv_1',
      adminUserId: 'u1',
      tokenHash,
      emailSnapshot: 'alice@example.com',
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
    }
  }

  it('flips admin to active + marks invite used + returns safe admin', async () => {
    mocks.findStaffInviteByTokenHash.mockResolvedValueOnce(validRow())
    mocks.markStaffInviteUsed.mockResolvedValueOnce(true)
    mocks.findAdminById.mockResolvedValueOnce({
      id: 'u1',
      email: 'alice@example.com',
      passwordHash: 'new-hashed',
      name: 'Alice',
      role: 'admin',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const result = await domain.acceptStaffInvite(raw, 'strong-pw-12345')

    expect(mocks.markStaffInviteUsed).toHaveBeenCalledWith(tokenHash)
    expect(mocks.updateAdminUser).toHaveBeenCalledTimes(1)
    const [id, patch] = mocks.updateAdminUser.mock.calls[0]
    expect(id).toBe('u1')
    expect(patch.status).toBe('active')
    expect(typeof patch.passwordHash).toBe('string')
    expect(patch.passwordHash).not.toBe('strong-pw-12345') // must be hashed
    expect(result.status).toBe('active')
    expect(result.email).toBe('alice@example.com')
  })

  it('rejects a password shorter than 8 chars before touching the DB', async () => {
    await expect(domain.acceptStaffInvite(raw, 'short')).rejects.toThrow(/at least 8/i)
    expect(mocks.findStaffInviteByTokenHash).not.toHaveBeenCalled()
  })

  it('rejects an empty token', async () => {
    await expect(domain.acceptStaffInvite('', 'strong-pw-12345')).rejects.toThrow()
    expect(mocks.findStaffInviteByTokenHash).not.toHaveBeenCalled()
  })

  it('rejects when row not found', async () => {
    mocks.findStaffInviteByTokenHash.mockResolvedValueOnce(null)
    await expect(domain.acceptStaffInvite(raw, 'strong-pw-12345')).rejects.toThrow(
      /invalid|already been used/i,
    )
  })

  it('rejects a used token', async () => {
    mocks.findStaffInviteByTokenHash.mockResolvedValueOnce({
      ...validRow(),
      usedAt: new Date(),
    })
    await expect(domain.acceptStaffInvite(raw, 'strong-pw-12345')).rejects.toThrow(
      /invalid|already been used/i,
    )
    expect(mocks.markStaffInviteUsed).not.toHaveBeenCalled()
  })

  it('rejects an expired token', async () => {
    mocks.findStaffInviteByTokenHash.mockResolvedValueOnce({
      ...validRow(),
      expiresAt: new Date(Date.now() - 1_000),
    })
    await expect(domain.acceptStaffInvite(raw, 'strong-pw-12345')).rejects.toThrow(/expired/i)
    expect(mocks.markStaffInviteUsed).not.toHaveBeenCalled()
  })

  it('rejects when markStaffInviteUsed returns false (concurrent accept race)', async () => {
    mocks.findStaffInviteByTokenHash.mockResolvedValueOnce(validRow())
    mocks.markStaffInviteUsed.mockResolvedValueOnce(false)
    await expect(domain.acceptStaffInvite(raw, 'strong-pw-12345')).rejects.toThrow(
      /invalid|already been used/i,
    )
    expect(mocks.updateAdminUser).not.toHaveBeenCalled()
  })
})
