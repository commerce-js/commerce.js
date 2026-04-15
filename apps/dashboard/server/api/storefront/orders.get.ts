// GET /api/storefront/orders — paginated order list for the signed-in buyer
//
// 401 if no buyer session. Uses admin.listOrders({ customerId }) which
// scopes the query server-side, so even if the adapter's customer state
// is wrong for concurrent requests, results cannot leak across buyers.
import { defineStorefrontHandler } from '../../utils/storefrontHandler'
import { requireBuyer } from '../../utils/buyerSession'

export default defineStorefrontHandler(async (event, { admin }) => {
  const { customerId } = await requireBuyer(event)
  const query = getQuery(event)

  return admin.listOrders({
    customerId,
    page: query.page ? Number(query.page) : undefined,
    perPage: query.perPage ? Number(query.perPage) : undefined,
  })
})
