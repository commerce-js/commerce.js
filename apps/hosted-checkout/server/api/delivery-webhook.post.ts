// ---------------------------------------------------------------------------
// POST /api/delivery-webhook — Receive Armada delivery status updates
// ---------------------------------------------------------------------------
// Armada sends order.updated + order.location.updated webhooks here.
// Updates order status in the database accordingly.
//
// Headers from Armada:
//   x-armada-webhook-topic: 'order.updated' | 'order.location.updated'
//   x-armada-webhook-id: unique event ID (for idempotency)
//   x-armada-timestamp: ISO 8601
//   x-armada-app-id: our app ID
// ---------------------------------------------------------------------------

import { createOrdersDomain } from '@commercejs/platform'

// Map Armada statuses to our internal order statuses
const STATUS_MAP: Record<string, string> = {
  pending: 'processing',
  dispatched: 'processing',
  waiting_pack: 'processing',
  en_route: 'shipped',
  completed: 'delivered',
  canceled: 'cancelled',
  failed: 'failed',
}

export default defineEventHandler(async (event) => {
  const topic = getHeader(event, 'x-armada-webhook-topic')
  const webhookId = getHeader(event, 'x-armada-webhook-id')

  const body = await readBody(event)

  console.log(`[delivery-webhook] topic=${topic} webhookId=${webhookId} status=${body?.status}`)

  // Handle order status updates
  if (topic === 'order.updated') {
    const { status, code, customer, driver, logistics } = body

    const internalStatus = STATUS_MAP[status]
    if (!internalStatus) {
      console.log(`[delivery-webhook] Unknown status: ${status}`)
      return { ok: true }
    }

    // If the order has a reference (our orderId), update it
    const orderId = body.reference
    if (orderId) {
      try {
        const config = useRuntimeConfig()
        const currency = (config as any).commerceCurrency || 'BHD'
        const ordersDomain = createOrdersDomain(currency)

        const note = buildNote(status, driver, logistics)
        await ordersDomain.updateOrderStatus(orderId, {
          status: internalStatus,
          note,
        })

        console.log(`[delivery-webhook] Order ${orderId} → ${internalStatus} (armada: ${status})`)
      }
      catch (err: any) {
        console.error(`[delivery-webhook] Failed to update order ${orderId}:`, err.message)
      }
    }
  }

  // Handle location updates (real-time driver tracking)
  if (topic === 'order.location.updated') {
    const { driver, status: orderStatus } = body
    console.log(`[delivery-webhook] Location update: driver=${driver?.name} lat=${driver?.latitude} lng=${driver?.longitude}`)
    // TODO: Push to SSE/WebSocket for real-time tracking in storefront
  }

  // Always return 200 per Armada docs
  return { ok: true }
})

function buildNote(
  status: string,
  driver?: { name: string; phone: string },
  logistics?: { tracking_url: string; estimated_duration: number },
): string {
  const parts = [`Delivery status: ${status}`]
  if (driver) parts.push(`Driver: ${driver.name} (${driver.phone})`)
  if (logistics?.tracking_url) parts.push(`Track: ${logistics.tracking_url}`)
  return parts.join(' · ')
}
