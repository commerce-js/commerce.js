// POST /api/storefront/auth/register — buyer account creation
//
// Body: { firstName, lastName, email, password, phone? }. Registers and
// auto-signs-in by storing the new customer.id in the buyer session.
import { defineStorefrontHandler } from '../../../utils/storefrontHandler'
import { getBuyerSession, setBuyerSession } from '../../../utils/buyerSession'

interface RegisterBody {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  phone?: string
}

export default defineStorefrontHandler(async (event, { adapter }) => {
  const body = await readBody<RegisterBody>(event)

  if (!body?.email || !body.password || body.password.length < 6 || !body.firstName || !body.lastName) {
    throw createError({
      statusCode: 400,
      message: 'firstName, lastName, email, and a password of at least 6 characters are required',
    })
  }

  const customer = await adapter.register({
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    password: body.password,
    phone: body.phone,
  })

  const existing = await getBuyerSession(event)
  await setBuyerSession(event, { customerId: customer.id, cartId: existing.cartId })
  return customer
})
