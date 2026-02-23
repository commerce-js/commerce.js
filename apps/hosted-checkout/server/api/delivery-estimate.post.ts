// ---------------------------------------------------------------------------
// POST /api/delivery-estimate — Estimate delivery fee and time
// ---------------------------------------------------------------------------
// Called during checkout when the customer enters their address and the
// selected shipping method has fulfillmentType === 'local_delivery'.
//
// Body: { origin, destination, providerId? }
// ---------------------------------------------------------------------------

import { z } from 'zod'
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

const estimateSchema = z.object({
  origin: addressSchema,
  destination: addressSchema,
  providerId: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const body = estimateSchema.parse(await readBody(event))
  const { providerId, ...input } = body

  const provider = await resolveDeliveryProvider(providerId)
  const estimate = await provider.estimate(input)

  return estimate
})
