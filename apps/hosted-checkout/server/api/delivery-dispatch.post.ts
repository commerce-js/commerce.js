// ---------------------------------------------------------------------------
// POST /api/delivery-dispatch — Dispatch a delivery for a confirmed order
// ---------------------------------------------------------------------------
// Admin/webhook-triggered endpoint. Separate from auto-dispatch — the
// merchant decides when to send a driver (e.g., after food prep).
//
// Optional auto-dispatch: set DELIVERY_AUTO_DISPATCH=true in env to trigger
// delivery immediately when an order is created.
//
// Body: { orderId, origin, destination, description?, cashOnDelivery?, providerId? }
// ---------------------------------------------------------------------------

import { z } from 'zod'
import { createOrdersDomain } from '@commercejs/platform'
import { ensureDb } from '../utils/db'
import { resolveDeliveryProvider } from '../utils/delivery'

const addressSchema = z.object({
  contactName: z.string().min(1),
  contactPhone: z.string().min(1),
  firstLine: z.string().min(1),
  secondLine: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  notes: z.string().optional(),
})

const dispatchSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  origin: addressSchema,
  destination: addressSchema,
  description: z.string().optional(),
  cashOnDelivery: z.number().optional(),
  providerId: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const body = dispatchSchema.parse(await readBody(event))
  const { orderId, providerId, ...deliveryInput } = body

  ensureDb()
  const config = useRuntimeConfig()
  const currency = (config as any).commerceCurrency || 'BHD'

  // 1. Resolve delivery provider
  const provider = await resolveDeliveryProvider(providerId)

  // 2. Create the delivery task
  const delivery = await provider.createDelivery({
    ...deliveryInput,
    orderId,
  })

  // 3. Update order with delivery info
  const ordersDomain = createOrdersDomain(currency)
  await ordersDomain.updateOrderStatus(orderId, {
    status: 'processing',
    note: `Delivery dispatched via ${provider.id} (delivery: ${delivery.id})`,
  })

  console.log(`[delivery-dispatch] Order ${orderId} → delivery ${delivery.id} via ${provider.id}`)

  return {
    deliveryId: delivery.id,
    providerId: provider.id,
    status: delivery.status,
    fee: delivery.fee,
    trackingUrl: delivery.trackingUrl,
    estimatedDuration: delivery.estimatedDuration,
    driver: delivery.driver,
  }
})
