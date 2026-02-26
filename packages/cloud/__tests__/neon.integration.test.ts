// ---------------------------------------------------------------------------
// Integration tests for NeonProvider
// Requires NEON_API_KEY in env — skipped otherwise
// ---------------------------------------------------------------------------

import { describe, it, expect, afterAll, beforeAll } from 'vitest'
import { NeonProvider } from '../src/providers/neon.js'

const NEON_API_KEY = process.env.NEON_API_KEY

const SKIP = !NEON_API_KEY
const TEST_PREFIX = `cjs-test-${Date.now()}`

/** Retry an async fn with exponential backoff (for Neon's 423 Locked during init) */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 5,
  baseDelayMs = 2000,
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    }
    catch (error: any) {
      const is423 = error?.statusCode === 423 || error?.status === 423
        || String(error?.message).includes('423')
      if (!is423 || attempt === maxRetries) throw error
      const delay = baseDelayMs * (attempt + 1)
      await new Promise(r => setTimeout(r, delay))
    }
  }
  throw new Error('Unreachable')
}

describe.skipIf(SKIP)('NeonProvider (integration)', () => {
  let provider: NeonProvider
  let createdProjectId: string | undefined
  let createdBranchId: string | undefined

  beforeAll(() => {
    provider = new NeonProvider({
      apiKey: NEON_API_KEY!,
    })
  })

  // Cleanup: delete project (which cascades to branches)
  afterAll(async () => {
    if (createdProjectId) {
      try {
        await provider.deleteProject(createdProjectId)
      }
      catch {
        // Best-effort cleanup
      }
    }
  })

  // -------------------------------------------------------------------------
  // Project CRUD
  // -------------------------------------------------------------------------

  it('should create a Neon project', async () => {
    const result = await provider.createProject(`${TEST_PREFIX}-db`, {
      region: 'aws-eu-central-1',
    })

    createdProjectId = result.projectId

    expect(result.projectId).toBeTruthy()
    expect(result.branchId).toBeTruthy()
    expect(result.connectionUri).toBeTruthy()
  })

  // -------------------------------------------------------------------------
  // Branch Management
  // -------------------------------------------------------------------------

  it('should create a branch from main', async () => {
    expect(createdProjectId).toBeTruthy()

    // Neon returns 423 Locked while the project endpoint is initializing
    // Retry with backoff until the project is ready
    const result = await retryWithBackoff(() =>
      provider.createBranch(createdProjectId!, {
        name: `${TEST_PREFIX}-preview`,
      }),
    )

    createdBranchId = result.branchId

    expect(result.branchId).toBeTruthy()
    expect(result.connectionUri).toBeTruthy()
  })

  it('should list branches', async () => {
    expect(createdProjectId).toBeTruthy()

    const branches = await provider.listBranches(createdProjectId!)

    expect(branches.length).toBeGreaterThanOrEqual(2) // main + our preview branch
    expect(branches.some(b => b.primary)).toBe(true)

    const previewBranch = branches.find(b => b.id === createdBranchId)
    expect(previewBranch).toBeDefined()
  })

  it('should get connection string for a branch', async () => {
    expect(createdProjectId).toBeTruthy()
    expect(createdBranchId).toBeTruthy()

    const connString = await provider.getConnectionString(
      createdProjectId!,
      createdBranchId!,
    )

    expect(connString).toBeTruthy()
    expect(connString).toContain('postgresql') // Should be a postgres URI
  })

  it('should delete a branch', async () => {
    expect(createdProjectId).toBeTruthy()
    expect(createdBranchId).toBeTruthy()

    await provider.deleteBranch(createdProjectId!, createdBranchId!)
    createdBranchId = undefined
  })

  // -------------------------------------------------------------------------
  // Project Deletion
  // -------------------------------------------------------------------------

  it('should delete the project', async () => {
    expect(createdProjectId).toBeTruthy()

    await provider.deleteProject(createdProjectId!)
    createdProjectId = undefined
  })
})
