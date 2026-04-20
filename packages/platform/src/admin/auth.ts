// ---------------------------------------------------------------------------
// Admin Auth domain — login, password management, user CRUD, staff invites
// ---------------------------------------------------------------------------

import { hash, compare } from 'bcrypt-ts'
import { createHash, randomBytes } from 'node:crypto'
import {
  findAdminByEmail,
  findAdminById,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser as dbDeleteAdmin,
  findAllAdminUsers,
  countAdminUsers,
  createStaffInviteRow,
  findStaffInviteByTokenHash,
  markStaffInviteUsed,
} from '../database/index.js'
import type { AdminUserSafe } from './types.js'

/** Days a staff invite remains valid after creation. */
const INVITE_EXPIRY_DAYS = 7

/** Strip passwordHash from admin user for safe responses */
function toSafe(row: any): AdminUserSafe {
  return {
    id: row.id,
    email: row.email,
    name: row.name ?? null,
    role: row.role,
    // Existing rows on older Neon branches may predate the status column
    // until migratePrisma() has re-run against them — default to 'active'.
    status: row.status ?? 'active',
    createdAt: row.createdAt ?? row.created_at,
    updatedAt: row.updatedAt ?? row.updated_at,
  }
}

/** Count admins whose role === 'owner'. Used by the last-owner guard. */
async function countOwners(): Promise<number> {
  const rows = await findAllAdminUsers()
  return rows.filter((r: any) => r.role === 'owner').length
}

/** Generate a 32-byte random token, base64url-encoded (43 chars, URL-safe). */
function generateRawToken(): string {
  return randomBytes(32).toString('base64url')
}

/** Hash a raw invite token for storage (sha256 hex). */
function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

export interface CreateStaffInviteResult {
  token: string
  expiresAt: Date
  tokenHash: string
}

export function createAdminAuthDomain() {
  return {
    /**
     * Authenticate an admin by email + password.
     * Returns the safe admin user if valid, throws otherwise.
     */
    async login(email: string, password: string): Promise<AdminUserSafe> {
      const row = await findAdminByEmail(email)
      if (!row) throw new Error('Invalid email or password')

      // Invited-but-not-yet-accepted rows have a NULL password_hash. Calling
      // bcrypt.compare against null throws; reject these rows explicitly so
      // the error is meaningful and the crash is prevented.
      const storedHash = row.passwordHash ?? (row as any).password_hash
      if (!storedHash) throw new Error('Account pending invite acceptance')

      const valid = await compare(password, storedHash)
      if (!valid) throw new Error('Invalid email or password')

      return toSafe(row)
    },

    /**
     * Change an admin's password. Requires current password for verification.
     */
    async changePassword(adminId: string, currentPassword: string, newPassword: string): Promise<void> {
      const row = await findAdminById(adminId)
      if (!row) throw new Error('Admin user not found')

      const valid = await compare(currentPassword, row.passwordHash ?? (row as any).password_hash)
      if (!valid) throw new Error('Current password is incorrect')

      await updateAdminUser(adminId, {
        passwordHash: await hash(newPassword, 10),
      })
    },

    /**
     * Create a new admin user.
     *
     * When `sendInvite: true`, the password is optional — the row is created
     * with `status='invited'` and `password_hash=NULL`, and a companion
     * `staff_invites` row + raw token are returned. The raw token exists
     * once; only its hash is persisted. The caller (dashboard route) is
     * responsible for enqueuing the invite email that carries the raw token.
     */
    async createAdmin(input: {
      email: string
      password?: string
      name?: string
      role?: 'owner' | 'admin' | 'editor'
      sendInvite?: boolean
    }): Promise<{
      admin: AdminUserSafe
      invite: CreateStaffInviteResult | null
    }> {
      const existing = await findAdminByEmail(input.email)
      if (existing) throw new Error('Admin with this email already exists')

      if (!input.sendInvite && !input.password) {
        throw new Error('Password is required when sendInvite is false')
      }

      const id = crypto.randomUUID()

      await createAdminUser({
        id,
        email: input.email,
        passwordHash: input.sendInvite
          ? (null as any) // stored NULL in DB; row is in 'invited' state until accept
          : await hash(input.password!, 10),
        name: input.name,
        role: input.role || 'admin',
        ...(input.sendInvite ? { status: 'invited' as any } : {}),
      } as any)

      let invite: CreateStaffInviteResult | null = null
      if (input.sendInvite) {
        invite = await createStaffInvite(id, input.email)
      }

      const created = await findAdminById(id)
      return { admin: toSafe(created), invite }
    },

    /**
     * Generate + persist a single-use staff invite token for an existing
     * admin user. Returns the raw token (to embed in the email URL) and the
     * expiry. Only the hash is stored.
     */
    createStaffInvite,

    /**
     * Look up an invite by raw token. Returns snapshot info or null when
     * missing / expired / already used.
     */
    async verifyStaffInviteToken(rawToken: string): Promise<{
      adminUserId: string
      email: string
      expiresAt: Date
    } | null> {
      if (!rawToken) return null
      const tokenHash = hashToken(rawToken)
      const row = await findStaffInviteByTokenHash(tokenHash)
      if (!row) return null
      if (row.usedAt ?? (row as any).used_at) return null
      const expiresAt = (row.expiresAt ?? (row as any).expires_at) as Date
      if (new Date(expiresAt).getTime() <= Date.now()) return null
      return {
        adminUserId: row.adminUserId ?? (row as any).admin_user_id,
        email: row.emailSnapshot ?? (row as any).email_snapshot,
        expiresAt: new Date(expiresAt),
      }
    },

    /**
     * Consume a staff invite: validates, sets the admin's password, flips
     * `status` to 'active', marks the invite used. Race-safe via single-row
     * `used_at IS NULL` predicate on the update.
     */
    async acceptStaffInvite(rawToken: string, newPassword: string): Promise<AdminUserSafe> {
      if (!rawToken) throw new Error('Invite token is required')
      if (!newPassword || newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters')
      }
      const tokenHash = hashToken(rawToken)
      const row = await findStaffInviteByTokenHash(tokenHash)
      if (!row) throw new Error('Invite is invalid or has already been used')
      if (row.usedAt ?? (row as any).used_at) {
        throw new Error('Invite is invalid or has already been used')
      }
      const expiresAt = (row.expiresAt ?? (row as any).expires_at) as Date
      if (new Date(expiresAt).getTime() <= Date.now()) {
        throw new Error('Invite has expired')
      }

      const adminUserId = row.adminUserId ?? (row as any).admin_user_id

      // Race-safe single-use mark — bails out if a concurrent request has
      // already consumed the token.
      const claimed = await markStaffInviteUsed(tokenHash)
      if (!claimed) throw new Error('Invite is invalid or has already been used')

      await updateAdminUser(adminUserId, {
        passwordHash: await hash(newPassword, 10),
        status: 'active',
      } as any)

      const updated = await findAdminById(adminUserId)
      if (!updated) throw new Error('Admin user not found after invite accept')
      return toSafe(updated)
    },

    /**
     * List all admin users (safe — no password hashes).
     */
    async listAdmins(): Promise<AdminUserSafe[]> {
      const rows = await findAllAdminUsers()
      return rows.map(toSafe)
    },

    /**
     * Get a single admin by ID (safe).
     */
    async getAdmin(id: string): Promise<AdminUserSafe> {
      const row = await findAdminById(id)
      if (!row) throw new Error('Admin user not found')
      return toSafe(row)
    },

    /**
     * Update an admin's name or role. Demoting the last owner is blocked here
     * (not just in the HTTP layer) so CLI scripts that call this method
     * directly can't lock the store out of itself.
     */
    async updateAdmin(
      id: string,
      input: { name?: string | null; role?: 'owner' | 'admin' | 'editor' },
    ): Promise<AdminUserSafe> {
      const row = await findAdminById(id)
      if (!row) throw new Error('Admin user not found')

      if (input.role && input.role !== row.role && row.role === 'owner') {
        const owners = await countOwners()
        if (owners <= 1) throw new Error('Cannot remove the last owner')
      }

      const patch: Record<string, any> = {}
      if (input.name !== undefined) patch.name = input.name
      if (input.role !== undefined) patch.role = input.role

      if (Object.keys(patch).length === 0) {
        return toSafe(row)
      }

      await updateAdminUser(id, patch)
      const updated = await findAdminById(id)
      return toSafe(updated)
    },

    /**
     * Delete an admin user. Cannot delete the last owner.
     */
    async deleteAdmin(id: string): Promise<void> {
      const row = await findAdminById(id)
      if (!row) throw new Error('Admin user not found')

      if (row.role === 'owner') {
        const owners = await countOwners()
        if (owners <= 1) throw new Error('Cannot remove the last owner')
      }

      await dbDeleteAdmin(id)
    },

    /**
     * Seed the initial admin from env vars if no admins exist.
     * Called on first startup after migration.
     */
    async seedInitialAdmin(): Promise<void> {
      const count = await countAdminUsers()
      if (count > 0) return // Already has admins

      const email = process.env.ADMIN_EMAIL || process.env.NUXT_ADMIN_EMAIL
      const password = process.env.ADMIN_PASSWORD || process.env.NUXT_ADMIN_PASSWORD

      if (!email || !password) {
        // No env vars set — skip seeding, admin must be created manually
        return
      }

      await createAdminUser({
        id: crypto.randomUUID(),
        email,
        passwordHash: await hash(password, 10),
        name: 'Admin',
        role: 'owner',
      })
    },
  }
}

async function createStaffInvite(adminUserId: string, email: string): Promise<CreateStaffInviteResult> {
  const token = generateRawToken()
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
  await createStaffInviteRow({
    id: crypto.randomUUID(),
    adminUserId,
    tokenHash,
    emailSnapshot: email,
    expiresAt,
  })
  return { token, expiresAt, tokenHash }
}
