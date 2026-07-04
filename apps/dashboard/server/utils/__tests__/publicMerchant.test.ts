import { describe, expect, it } from 'vitest'
import { maskDatabaseUrl, toPublicMerchant } from '../publicMerchant'

describe('maskDatabaseUrl', () => {
  it('masks the password in a credentialed connection string', () => {
    expect(maskDatabaseUrl('postgresql://user:s3cr3t@host:5432/db'))
      .toBe('postgresql://user:***@host:5432/db')
    expect(maskDatabaseUrl('postgres://u:p@ep-x.neon.tech/main?sslmode=require'))
      .toBe('postgres://u:***@ep-x.neon.tech/main?sslmode=require')
  })

  it('leaves a passwordless URL and null/undefined alone', () => {
    expect(maskDatabaseUrl('postgresql://host:5432/db')).toBe('postgresql://host:5432/db')
    expect(maskDatabaseUrl(null)).toBeNull()
    expect(maskDatabaseUrl(undefined)).toBeNull()
  })
})

describe('toPublicMerchant', () => {
  it('drops passwordHash and masks the databaseUrl credential', () => {
    const row = {
      id: 'm1',
      name: 'Acme',
      passwordHash: '$2b$10$hashhashhash',
      databaseUrl: 'postgresql://user:s3cr3t@host/db',
      neonProjectId: 'proj_1',
      domains: [{ id: 'd1' }],
    }
    const pub = toPublicMerchant(row) as Record<string, unknown>
    expect('passwordHash' in pub).toBe(false)
    expect(pub.databaseUrl).toBe('postgresql://user:***@host/db')
    // non-secret fields and relations pass through untouched
    expect(pub.id).toBe('m1')
    expect(pub.neonProjectId).toBe('proj_1')
    expect(pub.domains).toEqual([{ id: 'd1' }])
  })

  it('handles a not-yet-provisioned merchant (null databaseUrl, null hash)', () => {
    const pub = toPublicMerchant({ id: 'm2', passwordHash: null, databaseUrl: null }) as Record<string, unknown>
    expect('passwordHash' in pub).toBe(false)
    expect(pub.databaseUrl).toBeNull()
  })
})
