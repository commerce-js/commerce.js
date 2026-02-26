// ---------------------------------------------------------------------------
// Integration tests for CloudflareProvider
// Requires CF_API_TOKEN + CF_ACCOUNT_ID in env — skipped otherwise
// ---------------------------------------------------------------------------

import { describe, it, expect, afterAll, beforeAll } from 'vitest'
import { CloudflareProvider } from '../src/providers/cloudflare.js'

const CF_API_TOKEN = process.env.CF_API_TOKEN
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID

const SKIP = !CF_API_TOKEN || !CF_ACCOUNT_ID
const TEST_PREFIX = `cjs-test-${Date.now()}`

describe.skipIf(SKIP)('CloudflareProvider (integration)', () => {
  let provider: CloudflareProvider
  const createdResources: { type: string, name: string, id?: string }[] = []

  beforeAll(() => {
    provider = new CloudflareProvider({
      apiToken: CF_API_TOKEN!,
      accountId: CF_ACCOUNT_ID!,
    })
  })

  // Cleanup all created resources after tests
  afterAll(async () => {
    for (const resource of createdResources) {
      try {
        if (resource.type === 'pages') {
          await provider.deletePagesProject(resource.name)
        }
        else if (resource.type === 'r2') {
          await provider.deleteR2Bucket(resource.name)
        }
        else if (resource.type === 'kv' && resource.id) {
          await provider.deleteKVNamespace(resource.id)
        }
      }
      catch {
        // Best-effort cleanup
      }
    }
  })

  // -------------------------------------------------------------------------
  // Pages Project
  // -------------------------------------------------------------------------

  it('should create and delete a Pages project', async () => {
    const projectName = `${TEST_PREFIX}-pages`

    const result = await provider.createPagesProject(projectName)
    createdResources.push({ type: 'pages', name: projectName })

    expect(result).toBeDefined()
    expect(result.name).toBe(projectName)
    expect(result.subdomain).toContain('.pages.dev')

    // Delete the project
    await provider.deletePagesProject(projectName)
    // Remove from cleanup list since we just deleted it
    const idx = createdResources.findIndex(r => r.name === projectName)
    if (idx !== -1) createdResources.splice(idx, 1)
  })

  // -------------------------------------------------------------------------
  // R2 Bucket
  // -------------------------------------------------------------------------

  it('should create and delete an R2 bucket', async () => {
    const bucketName = `${TEST_PREFIX}-r2`

    const result = await provider.createR2Bucket(bucketName)
    createdResources.push({ type: 'r2', name: bucketName })

    expect(result).toBeDefined()
    expect(result.name).toBe(bucketName)

    // Delete the bucket
    await provider.deleteR2Bucket(bucketName)
    const idx = createdResources.findIndex(r => r.name === bucketName)
    if (idx !== -1) createdResources.splice(idx, 1)
  })

  // -------------------------------------------------------------------------
  // KV Namespace
  // -------------------------------------------------------------------------

  it('should create and delete a KV namespace', async () => {
    const namespaceName = `${TEST_PREFIX}-kv`

    const result = await provider.createKVNamespace(namespaceName)
    createdResources.push({ type: 'kv', name: namespaceName, id: result.id })

    expect(result).toBeDefined()
    expect(result.id).toBeTruthy()
    expect(result.title).toBe(namespaceName)

    // Delete the namespace
    await provider.deleteKVNamespace(result.id)
    const idx = createdResources.findIndex(r => r.name === namespaceName)
    if (idx !== -1) createdResources.splice(idx, 1)
  })
})
