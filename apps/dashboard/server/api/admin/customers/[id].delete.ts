// ---------------------------------------------------------------------------
// DELETE /api/admin/customers/:id — hard-delete a customer (GDPR / privacy)
//
// The platform's admin.deleteCustomer hard-deletes. If the customer has
// orders, the FK may reject the delete — surface the platform error as 400.
// ---------------------------------------------------------------------------

import { defineEventHandler, getRouterParam, createError, setResponseStatus } from 'h3'
import { requireMerchantSession } from '../../../utils/merchant-auth'

export default defineEventHandler(async (event) => {
  await requireMerchantSession(event)

  const admin = event.context.admin
  if (!admin) {
    throw createError({ statusCode: 500, statusMessage: 'Admin context missing' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  }

  try {
    await admin.deleteCustomer(id)
  }
  catch (err: any) {
    const message = err?.message ?? 'Could not delete customer'
    if (/not found/i.test(message)) {
      throw createError({ statusCode: 404, statusMessage: 'Customer not found' })
    }
    throw createError({ statusCode: 400, statusMessage: message })
  }

  setResponseStatus(event, 204)
  return null
})
