// ---------------------------------------------------------------------------
// Admin Auth domain — login, password management, user CRUD
// ---------------------------------------------------------------------------

import { hash, compare } from 'bcrypt-ts'
import {
  findAdminByEmail,
  findAdminById,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser as dbDeleteAdmin,
  findAllAdminUsers,
  countAdminUsers,
} from '../database/index.js'
import type { AdminUserSafe } from './types.js'

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

export function createAdminAuthDomain() {
  return {
    /**
     * Authenticate an admin by email + password.
     * Returns the safe admin user if valid, throws otherwise.
     */
    async login(email: string, password: string): Promise<AdminUserSafe> {
      const row = await findAdminByEmail(email)
      if (!row) throw new Error('Invalid email or password')

      const valid = await compare(password, row.passwordHash ?? (row as any).password_hash)
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
     */
    async createAdmin(input: {
      email: string
      password: string
      name?: string
      role?: 'owner' | 'admin' | 'editor'
    }): Promise<AdminUserSafe> {
      const existing = await findAdminByEmail(input.email)
      if (existing) throw new Error('Admin with this email already exists')

      const id = crypto.randomUUID()

      await createAdminUser({
        id,
        email: input.email,
        passwordHash: await hash(input.password, 10),
        name: input.name,
        role: input.role || 'admin',
      })

      const created = await findAdminById(id)
      return toSafe(created)
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
