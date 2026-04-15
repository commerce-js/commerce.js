// POST /api/storefront/checkout — begin checkout by setting addresses
//
// Body: { shippingAddress, billingAddress? }. If billingAddress is omitted
// the shippingAddress is used for both. Returns the updated cart.
import { defineStorefrontHandler } from '../../utils/storefrontHandler'
import { getBuyerSession } from '../../utils/buyerSession'
import type { Address } from '@commercejs/types'

type AddressInput = Omit<Address, 'id' | 'isDefault'>

function isValidAddress(a: unknown): a is AddressInput {
  if (!a || typeof a !== 'object') return false
  const obj = a as Record<string, unknown>
  return typeof obj.street === 'string' && obj.street.length > 0
    && typeof obj.city === 'string' && obj.city.length > 0
    && typeof obj.country === 'string' && obj.country.length > 0
}

export default defineStorefrontHandler(async (event, { adapter }) => {
  const body = await readBody<{ shippingAddress?: AddressInput, billingAddress?: AddressInput }>(event)

  if (!body || !isValidAddress(body.shippingAddress)) {
    throw createError({ statusCode: 400, message: 'shippingAddress with street, city, country is required' })
  }

  const session = await getBuyerSession(event)
  if (!session.cartId) {
    throw createError({ statusCode: 404, message: 'No active cart' })
  }

  const billing = body.billingAddress && isValidAddress(body.billingAddress)
    ? body.billingAddress
    : body.shippingAddress

  await adapter.setShippingAddress(session.cartId, body.shippingAddress)
  return adapter.setBillingAddress(session.cartId, billing)
})
