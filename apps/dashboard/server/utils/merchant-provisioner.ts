// ---------------------------------------------------------------------------
// Merchant Provisioner — turns a 'provisioning' Merchant row into 'active'
// ---------------------------------------------------------------------------
//
// Pipeline (invoked by the `provision-store` BullMQ handler in worker.ts):
//
//   1. Fetch merchant from control DB — abort if missing or already active.
//   2. Create a dedicated Neon project (one project per merchant: cheaper
//      lifecycle, cleanly isolated, simpler off-boarding).
//   3. Apply the platform's Prisma schema to the new branch via
//      `migratePrisma()` bound into the new Prisma client with
//      `runWithDb(client, ...)`.
//   4. Write databaseUrl / neonProjectId / neonBranchId + flip
//      status='active' in the control DB.
//
// Idempotent: re-running after a partial failure re-uses the existing
// Neon project (stored on merchant.neonProjectId). Never calls
// createMerchantProject twice for the same merchant.
//
// Error handling:
//   - Transient errors (network, 423/429/5xx Neon) surface as regular
//     throws so BullMQ retries with the queue's exponential backoff.
//   - Permanent errors (merchant not found, invalid config) throw via
//     `PermanentError` so the worker can mark the job failed-fast rather
//     than burning all its retries.
// ---------------------------------------------------------------------------

import { getPrismaClient, migratePrisma, runWithDb } from '@commercejs/platform'
import { useDB } from './db'
import { createMerchantProject, type NeonProjectResult } from './neon'
import { invalidateMerchantCache } from './tenant'

/**
 * Marker for errors that should NOT be retried by BullMQ. The worker
 * still logs and fails the job — but we skip the remaining attempts
 * so a clearly-broken merchant row doesn't waste the queue's budget.
 */
export class PermanentError extends Error {
  readonly permanent = true as const
  constructor(message: string) {
    super(message)
    this.name = 'PermanentError'
  }
}

export interface ProvisionResult {
  merchantId: string
  neonProjectId: string
  neonBranchId: string
}

/**
 * Run the provisioning pipeline for a merchant. Safe to invoke multiple
 * times — steps short-circuit if their output is already persisted.
 */
export async function provisionMerchant(merchantId: string): Promise<ProvisionResult> {
  const db = useDB()

  // --- 1. Load the merchant row
  const merchant = await db.merchant.findUnique({ where: { id: merchantId } })
  if (!merchant) {
    throw new PermanentError(`merchant ${merchantId} not found`)
  }
  if (merchant.status === 'active' && merchant.databaseUrl && merchant.neonProjectId) {
    return {
      merchantId,
      neonProjectId: merchant.neonProjectId,
      neonBranchId: merchant.neonBranchId ?? '',
    }
  }

  // --- 2. Create / reuse the Neon project
  let neon: NeonProjectResult
  if (merchant.neonProjectId && merchant.databaseUrl) {
    // A previous attempt created the project but failed later in the
    // pipeline. Reuse it and retry from step 3.
    neon = {
      projectId: merchant.neonProjectId,
      branchId: merchant.neonBranchId ?? '',
      connectionUri: merchant.databaseUrl,
      host: '',
    }
  }
  else {
    neon = await createMerchantProject(`cjs-${merchant.subdomain}`)
    // Persist the infra handles BEFORE attempting migrations so a
    // migration failure doesn't orphan the Neon project.
    await db.merchant.update({
      where: { id: merchantId },
      data: {
        databaseUrl: neon.connectionUri,
        neonProjectId: neon.projectId,
        neonBranchId: neon.branchId,
      },
    })
  }

  // --- 3. Apply the platform schema to the new branch
  const prisma = getPrismaClient(neon.connectionUri)
  await runWithDb(prisma, async () => {
    await migratePrisma()
  })

  // --- 4. Flip status and invalidate the resolver cache so the next
  //        request sees the provisioned merchant.
  await db.merchant.update({
    where: { id: merchantId },
    data: { status: 'active' },
  })
  invalidateMerchantCache(merchantId)

  return {
    merchantId,
    neonProjectId: neon.projectId,
    neonBranchId: neon.branchId,
  }
}
