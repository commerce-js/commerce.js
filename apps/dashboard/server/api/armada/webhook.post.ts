// ---------------------------------------------------------------------------
// Armada Webhook Endpoint — receives delivery, driver, and wallet webhooks
// ---------------------------------------------------------------------------
// Handles all 3 Armada webhook topics:
//   - order.updated       — delivery status changes
//   - order.location.updated — driver location updates  
//   - wallet.balance_low  — wallet balance warning
//
// Docs: https://docs.armadadelivery.com/v1/webhooks/

import { defineEventHandler, readBody, getHeader } from 'h3'

export default defineEventHandler(async (event) => {
  const topic = getHeader(event, 'x-armada-webhook-topic')
  const webhookId = getHeader(event, 'x-armada-webhook-id')
  const timestamp = getHeader(event, 'x-armada-timestamp')
  const body = await readBody(event)

  console.log(`[armada] 📦 Webhook received:`)
  console.log(`  topic: ${topic}`)
  console.log(`  webhook_id: ${webhookId}`)
  console.log(`  timestamp: ${timestamp}`)
  console.log(`  body:`, JSON.stringify(body, null, 2))

  // TODO: In production, route these to the appropriate handler:
  // - order.updated → update order delivery status
  // - order.location.updated → broadcast driver location to customer
  // - wallet.balance_low → alert merchant about low balance

  return { status: 'ok' }
})
