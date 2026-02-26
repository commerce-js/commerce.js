// ---------------------------------------------------------------------------
// Armada Uninstall Webhook — cleanup when merchant removes the app
// ---------------------------------------------------------------------------
// Armada sends a POST when a merchant uninstalls. The integration is removed
// on Armada's side regardless of our response. We clean up stored tokens.
//
// Docs: https://docs.armadadelivery.com/v1/webhooks/app-uninstalled/

import { defineEventHandler, readBody, getHeader } from 'h3'

export default defineEventHandler(async (event) => {
  const topic = getHeader(event, 'x-armada-webhook-topic')
  const installationId = getHeader(event, 'x-armada-installation-id')
  const body = await readBody<{ reason?: string }>(event)

  console.log(
    `[armada] Uninstall webhook: topic=${topic}, installation_id=${installationId}, reason=${body?.reason}`,
  )

  const storage = useStorage('data')
  await storage.removeItem('armada:config')

  console.log('[armada] ✅ Uninstall cleanup complete')

  return { status: 'ok' }
})
