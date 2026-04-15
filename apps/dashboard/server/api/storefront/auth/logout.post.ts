// POST /api/storefront/auth/logout — clear the buyer session cookie
//
// We don't call adapter.logout(); the adapter's in-memory currentCustomerId
// is a per-instance singleton shared across merchants' requests and mutating
// it would affect other concurrent buyers. The cookie is the source of truth.
import { defineStorefrontHandler } from '../../../utils/storefrontHandler'
import { clearBuyerSession } from '../../../utils/buyerSession'

export default defineStorefrontHandler(async (event) => {
  await clearBuyerSession(event)
  return { success: true }
})
