// ---------------------------------------------------------------------------
// Neon API wrapper — thin, scoped to what the merchant-provisioner needs
// ---------------------------------------------------------------------------
//
// We deliberately avoid importing from @commercejs/cloud (locked decision
// on the fly/eaas branch). This helper is a focused re-implementation:
// one project per merchant (cleaner isolation + cheaper to delete on
// off-board), retry-with-backoff on the `423 Locked` window that Neon
// returns for a few seconds after project creation while endpoints boot.
//
// Auth: NEON_API_KEY from the monorepo-root .secrets file / Fly secrets.
// ---------------------------------------------------------------------------

import process from 'node:process'

const NEON_API_BASE = 'https://console.neon.tech/api/v2'

/** Default region — MENA-first platform, keep this close to Fly `bah`. */
export const DEFAULT_NEON_REGION = 'aws-eu-central-1'

export interface NeonProjectResult {
  projectId: string
  branchId: string
  connectionUri: string
  host: string
}

export interface NeonRetryOptions {
  baseDelayMs?: number
  maxRetries?: number
}

function apiKey(): string {
  const key = process.env.NEON_API_KEY
  if (!key) {
    throw new Error(
      'NEON_API_KEY is not set. Configure it in the monorepo-root .secrets '
      + 'file (local) or Fly.io app secrets (prod) before provisioning.',
    )
  }
  return key
}

async function neonFetch<T>(
  path: string,
  init: RequestInit & { retryOnLocked?: boolean, retry?: NeonRetryOptions } = {},
): Promise<T> {
  const { retryOnLocked = false, retry, ...rest } = init
  const baseDelay = retry?.baseDelayMs ?? 2000
  const maxRetries = retry?.maxRetries ?? 5

  let attempt = 0
  while (true) {
    const res = await fetch(`${NEON_API_BASE}${path}`, {
      ...rest,
      headers: {
        ...(rest.headers as Record<string, string> | undefined),
        authorization: `Bearer ${apiKey()}`,
        'content-type': 'application/json',
      },
    })

    if (res.ok) return res.json() as Promise<T>

    const transient = res.status === 423 || res.status === 429 || res.status >= 500
    if (retryOnLocked && transient && attempt < maxRetries) {
      const delay = baseDelay * 2 ** attempt
      console.warn(
        '[neon] %s %s → %d (attempt %d/%d, retrying in %dms)',
        rest.method ?? 'GET',
        path,
        res.status,
        attempt + 1,
        maxRetries,
        delay,
      )
      await new Promise(r => setTimeout(r, delay))
      attempt++
      continue
    }

    const body = await res.text().catch(() => '')
    throw new Error(`Neon ${rest.method ?? 'GET'} ${path} → ${res.status} ${res.statusText}: ${body.slice(0, 400)}`)
  }
}

// ---------------------------------------------------------------------------
// Project
// ---------------------------------------------------------------------------

/**
 * Create a dedicated Neon project for a merchant. Returns project id,
 * primary branch id, and a ready-to-use pooled connection URI.
 *
 * Neon returns the `connection_uris` array IMMEDIATELY in the project-
 * create response, but for a short window (~3 s) further API calls may
 * 423 Locked while endpoints initialize. The pooled URI itself is ready
 * for queries as soon as this call returns — migrations run fine against
 * it without additional waits (the lock only affects the Neon control
 * API, not the SQL endpoint).
 */
export async function createMerchantProject(
  name: string,
  options: { region?: string } = {},
): Promise<NeonProjectResult> {
  interface CreateProjectResponse {
    project: { id: string }
    branch: { id: string }
    endpoints?: Array<{ host?: string }>
    connection_uris?: Array<{ connection_uri?: string }>
  }

  const response = await neonFetch<CreateProjectResponse>('/projects', {
    method: 'POST',
    body: JSON.stringify({
      project: {
        name,
        region_id: options.region ?? DEFAULT_NEON_REGION,
        pg_version: 16,
      },
    }),
    // The 423 window only affects post-create control-API calls, but creates
    // can still hit transient 429/5xx — retry those with the same backoff.
    retryOnLocked: true,
  })

  const connectionUri = response.connection_uris?.[0]?.connection_uri ?? ''
  if (!connectionUri) {
    throw new Error(`Neon create-project response missing connection_uri (projectId=${response.project.id})`)
  }

  return {
    projectId: response.project.id,
    branchId: response.branch.id,
    connectionUri,
    host: response.endpoints?.[0]?.host ?? '',
  }
}

/**
 * Delete a Neon project. Idempotent: a 404 (already gone — e.g. a prior
 * partial hard-delete removed the project but failed to delete the control
 * row, or an operator removed it in the Neon console) is treated as success
 * so retrying a stuck hard-delete converges instead of 502-ing forever.
 */
export async function deleteMerchantProject(projectId: string): Promise<void> {
  try {
    await neonFetch<void>(`/projects/${projectId}`, {
      method: 'DELETE',
      // Deletes can 423 briefly too if a branch operation is mid-flight.
      retryOnLocked: true,
    })
  }
  catch (error) {
    // neonFetch throws `Neon DELETE … → 404 …` for an already-deleted project.
    if (error instanceof Error && /→ 404\b/.test(error.message)) return
    throw error
  }
}
