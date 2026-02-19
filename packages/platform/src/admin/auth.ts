// ---------------------------------------------------------------------------
// Admin Auth domain — login, password management, user CRUD
// ---------------------------------------------------------------------------

import { hashSync, compareSync } from 'bcrypt-ts'
import {
  findAdminByEmail,
  findAdminById,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser as dbDeleteAdmin,
  findAllAdminUsers,
  countAdminUsers,
} from '../database/index.js'
import type { AdminUser, AdminUserSafe } from './types.js'

/** Strip passwordHash from admin user for safe responses */
function toSafe(row: any): AdminUserSafe {
  return {
    id: row.id,
    email: row.email,
    name: row.name ?? null,
    role: row.role,
    createdAt: row.createdAt ?? row.created_at,
    updatedAt: row.updatedAt ?? row.updated_at,
  }
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

      const valid = compareSync(password, row.passwordHash ?? (row as any).password_hash)
      if (!valid) throw new Error('Invalid email or password')

      return toSafe(row)
    },

    /**
     * Change an admin's password. Requires current password for verification.
     */
    async changePassword(adminId: string, currentPassword: string, newPassword: string): Promise<void> {
      const row = await findAdminById(adminId)
      if (!row) throw new Error('Admin user not found')

      const valid = compareSync(currentPassword, row.passwordHash ?? (row as any).password_hash)
      if (!valid) throw new Error('Current password is incorrect')

      await updateAdminUser(adminId, {
        passwordHash: hashSync(newPassword, 10),
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
        passwordHash: hashSync(input.password, 10),
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
     * Delete an admin user. Cannot delete the last owner.
     */
    async deleteAdmin(id: string): Promise<void> {
      const row = await findAdminById(id)
      if (!row) throw new Error('Admin user not found')

      if (row.role === 'owner') {
        const total = await countAdminUsers()
        if (total <= 1) throw new Error('Cannot delete the last admin user')
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
        passwordHash: hashSync(password, 10),
        name: 'Admin',
        role: 'owner',
      })
    },
  }
}
