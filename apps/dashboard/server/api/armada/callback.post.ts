// ---------------------------------------------------------------------------
// Armada Callback Endpoint — receives the access_token after install
// ---------------------------------------------------------------------------
// After the merchant's install is verified, Armada POSTs here with:
//   - installation_id, app, merchant, inputs, access_token
//
// We persist the access_token to the Neon database (integrations table)
// and also keep it in memory for the current session.
// MUST return 200 or the install fails on Armada's end.

import { defineEventHandler, readBody, createError } from 'h3'
import { neon } from '@neondatabase/serverless'

interface ArmadaCallbackBody {
  installation_id: string
  app: { id: string; name: string }
  merchant: { id: string; name: string; email: string; country: string }
  inputs: Array<{ name: string; value: unknown }>
  access_token: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ArmadaCallbackBody>(event)

  if (!body?.installation_id || !body?.access_token) {
    throw createError({
      statusCode: 400,
      message: 'Missing installation_id or access_token in callback body',
    })
  }

  const config = {
    accessToken: body.access_token,
    merchantId: body.merchant.id,
    merchantName: body.merchant.name,
    merchantEmail: body.merchant.email,
    merchantCountry: body.merchant.country,
    appId: body.app.id,
    appName: body.app.name,
    inputs: body.inputs || [],
    installationId: body.installation_id,
    installedAt: new Date().toISOString(),
  }

  // 1. Store in-memory for current session
  const storage = useStorage('data')
  await storage.setItem('armada:config', config)

  // 2. Persist to Neon database (survives restarts)
  const runtimeConfig = useRuntimeConfig()
  const dbUrl = runtimeConfig.databaseUrl

  if (dbUrl) {
    try {
      const sql = neon(dbUrl)
      await sql`
        INSERT INTO integrations (provider, access_token, config, status, connected_at, updated_at)
        VALUES (
          'armada',
          ${body.access_token},
          ${JSON.stringify(config)}::jsonb,
          'connected',
          NOW(),
          NOW()
        )
        ON CONFLICT (provider)
        DO UPDATE SET
          access_token = EXCLUDED.access_token,
          config = EXCLUDED.config,
          status = 'connected',
          connected_at = NOW(),
          updated_at = NOW()
      `
      console.log(`[armada] ✅ Token persisted to database`)
    } catch (err) {
      console.error(`[armada] ⚠️ Failed to persist to DB (will use in-memory):`, err)
    }
  }

  console.log(
    `[armada] ✅ Installation complete: merchant=${body.merchant.name} (${body.merchant.id}), ` +
    `token=${body.access_token.substring(0, 12)}...`,
  )

  // Must return 200 OK
  return { status: 'ok' }
})
