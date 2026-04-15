// GET /api/storefront/auth/me — profile of the signed-in buyer
//
// 401 if no buyer session. Fetches the customer by ID via the per-merchant
// admin API (bypassing adapter.getCustomer, whose singleton customer state
// isn't request-scoped in the current platform — see CUSTOMER-STATE note
// in utils/buyerSession.ts).
import { defineStorefrontHandler } from '../../../utils/storefrontHandler'
import { requireBuyer } from '../../../utils/buyerSession'

export default defineStorefrontHandler(async (event, { admin }) => {
  const { customerId } = await requireBuyer(event)
  return admin.getCustomer(customerId)
})
