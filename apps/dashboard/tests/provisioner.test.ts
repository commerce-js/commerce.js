// ---------------------------------------------------------------------------
// Merchant provisioner — offline tests via the injectable deps
// ---------------------------------------------------------------------------

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@commercejs/platform', () => ({
  getPrismaClient: vi.fn(),
  migratePrisma: vi.fn(),
  runWithDb: vi.fn(),
}))
vi.mock('../server/utils/db', () => ({
  useDB: () => { throw new Error('tests must inject controlDb') },
}))
vi.mock('../server/utils/tenant', () => ({
  invalidateMerchantCache: vi.fn(),
}))

import { provisionMerchant, PermanentError } from '../server/utils/merchant-provisioner'

function makeMerchant(overrides: Record<string, unknown> = {}) {
  return {
    id: 'm-1',
    name: 'Test Store',
    email: 'owner@test.com',
    subdomain: 'test-store',
    plan: 'trial',
    status: 'provisioning',
    currency: 'SAR',
    locale: 'ar-SA',
    databaseUrl: null as string | null,
    neonProjectId: null as string | null,
    neonBranchId: null as string | null,
    ...overrides,
  }
}

function makeControlDb(merchant: ReturnType<typeof makeMerchant> | null) {
  const updates: Array<Record<string, unknown>> = []
  return {
    updates,
    merchant: {
      findUnique: vi.fn().mockResolvedValue(merchant),
      update: vi.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
        updates.push(data)
        return { ...merchant, ...data }
      }),
    },
  }
}

const NEON_RESULT = {
  projectId: 'proj-1',
  branchId: 'br-main',
  connectionUri: 'postgresql://u:p@ep-abc-pooler.eu-central-1.aws.neon.tech/neondb',
  host: 'ep-abc-pooler.eu-central-1.aws.neon.tech',
}

beforeEach(() => vi.clearAllMocks())

describe('provisionMerchant', () => {
  it('provisions end-to-end: project → schema+seed → active with error cleared', async () => {
    const controlDb = makeControlDb(makeMerchant())
    const createProject = vi.fn().mockResolvedValue(NEON_RESULT)
    const initSchema = vi.fn().mockResolvedValue(undefined)

    const result = await provisionMerchant('m-1', { controlDb: controlDb as never, createProject, initSchema })

    expect(createProject).toHaveBeenCalledWith('cjs-test-store')
    expect(initSchema).toHaveBeenCalledWith(NEON_RESULT.connectionUri, expect.objectContaining({
      name: 'Test Store',
      currency: 'SAR',
    }))
    // Infra handles persisted BEFORE schema init (orphan-protection order)
    expect(controlDb.updates[0]).toMatchObject({ neonProjectId: 'proj-1', databaseUrl: NEON_RESULT.connectionUri })
    expect(controlDb.updates.at(-1)).toMatchObject({ status: 'active', provisionError: null })
    expect(result).toEqual({ merchantId: 'm-1', neonProjectId: 'proj-1', neonBranchId: 'br-main' })
  })

  it('is idempotent for already-active merchants', async () => {
    const controlDb = makeControlDb(makeMerchant({
      status: 'active',
      databaseUrl: 'postgresql://x',
      neonProjectId: 'proj-1',
      neonBranchId: 'br-main',
    }))
    const createProject = vi.fn()

    const result = await provisionMerchant('m-1', { controlDb: controlDb as never, createProject, initSchema: vi.fn() })

    expect(createProject).not.toHaveBeenCalled()
    expect(controlDb.updates).toHaveLength(0)
    expect(result.neonProjectId).toBe('proj-1')
  })

  it('reuses an existing Neon project on retry (never creates twice)', async () => {
    const controlDb = makeControlDb(makeMerchant({
      neonProjectId: 'proj-1',
      databaseUrl: NEON_RESULT.connectionUri,
      neonBranchId: 'br-main',
    }))
    const createProject = vi.fn()
    const initSchema = vi.fn().mockResolvedValue(undefined)

    await provisionMerchant('m-1', { controlDb: controlDb as never, createProject, initSchema })

    expect(createProject).not.toHaveBeenCalled()
    expect(initSchema).toHaveBeenCalledWith(NEON_RESULT.connectionUri, expect.anything())
    expect(controlDb.updates.at(-1)).toMatchObject({ status: 'active' })
  })

  it('marks the merchant failed on PermanentError and rethrows', async () => {
    const controlDb = makeControlDb(makeMerchant())
    const createProject = vi.fn().mockRejectedValue(new PermanentError('invalid NEON_API_KEY'))

    await expect(provisionMerchant('m-1', {
      controlDb: controlDb as never,
      createProject,
      initSchema: vi.fn(),
    })).rejects.toThrow('invalid NEON_API_KEY')

    expect(controlDb.updates.at(-1)).toMatchObject({
      status: 'failed',
      provisionError: expect.stringContaining('invalid NEON_API_KEY'),
    })
  })

  it('records transient errors WITHOUT marking failed, and rethrows for BullMQ retry', async () => {
    const controlDb = makeControlDb(makeMerchant())
    const createProject = vi.fn().mockRejectedValue(new Error('Neon POST /projects → 500'))

    await expect(provisionMerchant('m-1', {
      controlDb: controlDb as never,
      createProject,
      initSchema: vi.fn(),
    })).rejects.toThrow('500')

    const last = controlDb.updates.at(-1)!
    expect(last.provisionError).toContain('500')
    expect(last.status).toBeUndefined() // stays 'provisioning' for the retry
  })

  it('throws PermanentError fast when the merchant row is missing', async () => {
    const controlDb = makeControlDb(null)
    await expect(provisionMerchant('nope', { controlDb: controlDb as never }))
      .rejects.toBeInstanceOf(PermanentError)
    expect(controlDb.updates).toHaveLength(0)
  })
})
