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
//      `runWithDb(client, ...)`, then seed the store info row.
//   4. Write databaseUrl / neonProjectId / neonBranchId + flip
//      status='active' in the control DB.
//
// Idempotent: re-running after a partial failure re-uses the existing
// Neon project (stored on merchant.neonProjectId). Never calls
// createMerchantProject twice for the same merchant.
//
// Error handling (observable — every failure lands in merchant.provisionError):
//   - Transient errors (network, 423/429/5xx Neon) record provisionError and
//     rethrow so BullMQ retries with the queue's exponential backoff.
//   - Permanent errors (merchant not found, invalid config) mark the merchant
//     status='failed' + provisionError, then throw `PermanentError` so the
//     worker fails the job fast instead of burning retries. Operators re-run
//     via POST /api/merchants/:id/provision after fixing the cause.
//
// Dependencies are injectable (tests run fully offline — see
// apps/dashboard/tests/provisioner.test.ts).
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

/** Injectable effects — defaults are the real implementations. */
export interface ProvisionerDeps {
  controlDb: Pick<ReturnType<typeof useDB>, 'merchant'>
  createProject: (name: string) => Promise<NeonProjectResult>
  /** Apply the platform schema + seed store info on the fresh merchant DB. */
  initSchema: (connectionUri: string, merchant: {
    name: string
    email: string
    currency: string
    locale: string
  }) => Promise<void>
}

async function defaultInitSchema(
  connectionUri: string,
  merchant: { name: string, email: string, currency: string, locale: string },
): Promise<void> {
  const prisma = getPrismaClient(connectionUri)
  await runWithDb(prisma, async () => {
    await migratePrisma()

    // Seed the store identity so the storefront renders something real on
    // first load. Merchant staff admin_users are NOT seeded here — the
    // first-login bootstrap in merchant-auth.ts owns that.
    await prisma.storeInfo.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        name: merchant.name,
        currency: merchant.currency,
        locale: merchant.locale.startsWith('ar') ? 'ar' : 'en',
        timezone: 'Asia/Riyadh',
        contactEmail: merchant.email,
        supportedCurrencies: [merchant.currency],
        supportedLocales: ['en', 'ar'],
      },
      update: {},
    })
  })
}

function resolveDeps(overrides: Partial<ProvisionerDeps>): ProvisionerDeps {
  return {
    controlDb: overrides.controlDb ?? useDB(),
    createProject: overrides.createProject ?? (name => createMerchantProject(name)),
    initSchema: overrides.initSchema ?? defaultInitSchema,
  }
}

/** Best-effort provisionError write — never masks the original failure. */
async function recordFailure(
  controlDb: ProvisionerDeps['controlDb'],
  merchantId: string,
  message: string,
  markFailed: boolean,
): Promise<void> {
  try {
    await controlDb.merchant.update({
      where: { id: merchantId },
      data: markFailed
        ? { status: 'failed', provisionError: message }
        : { provisionError: message },
    })
    invalidateMerchantCache(merchantId)
  }
  catch {
    // Control DB unreachable — the original error is what matters.
  }
}

/**
 * Run the provisioning pipeline for a merchant. Safe to invoke multiple
 * times — steps short-circuit if their output is already persisted.
 */
export async function provisionMerchant(
  merchantId: string,
  overrides: Partial<ProvisionerDeps> = {},
): Promise<ProvisionResult> {
  const { controlDb, createProject, initSchema } = resolveDeps(overrides)

  // --- 1. Load the merchant row
  const merchant = await controlDb.merchant.findUnique({ where: { id: merchantId } })
  if (!merchant) {
    // No row to record the failure on — fail the job fast.
    throw new PermanentError(`merchant ${merchantId} not found`)
  }
  if (merchant.status === 'active' && merchant.databaseUrl && merchant.neonProjectId) {
    return {
      merchantId,
      neonProjectId: merchant.neonProjectId,
      neonBranchId: merchant.neonBranchId ?? '',
    }
  }

  try {
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
      neon = await createProject(`cjs-${merchant.subdomain}`)
      // Persist the infra handles BEFORE attempting migrations so a
      // migration failure doesn't orphan the Neon project.
      await controlDb.merchant.update({
        where: { id: merchantId },
        data: {
          databaseUrl: neon.connectionUri,
          neonProjectId: neon.projectId,
          neonBranchId: neon.branchId,
        },
      })
    }

    // --- 3. Apply the platform schema + seed store identity
    await initSchema(neon.connectionUri, {
      name: merchant.name,
      email: merchant.email,
      currency: merchant.currency,
      locale: merchant.locale,
    })

    // --- 4. Flip status (clearing any stale error) and invalidate the
    //        resolver cache so the next request sees the provisioned merchant.
    await controlDb.merchant.update({
      where: { id: merchantId },
      data: { status: 'active', provisionError: null },
    })
    invalidateMerchantCache(merchantId)

    return {
      merchantId,
      neonProjectId: neon.projectId,
      neonBranchId: neon.branchId,
    }
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const permanent = error instanceof PermanentError
    await recordFailure(controlDb, merchantId, message, permanent)
    throw error
  }
}
