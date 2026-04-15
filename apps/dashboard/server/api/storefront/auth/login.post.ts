// POST /api/storefront/auth/login — buyer email/password sign-in
//
// Calls adapter.login() to verify credentials, then stores the returned
// customer.id on the buyer session cookie. Any existing cartId is kept so
// an anonymous cart carries over into the signed-in session.
import { defineStorefrontHandler } from '../../../utils/storefrontHandler'
import { getBuyerSession, setBuyerSession } from '../../../utils/buyerSession'

export default defineStorefrontHandler(async (event, { adapter }) => {
  const body = await readBody<{ email?: string, password?: string }>(event)

  if (!body?.email || !body?.password) {
    throw createError({ statusCode: 400, message: 'email and password are required' })
  }

  const customer = await adapter.login(body.email, body.password)

  const existing = await getBuyerSession(event)
  await setBuyerSession(event, { customerId: customer.id, cartId: existing.cartId })
  return customer
})
