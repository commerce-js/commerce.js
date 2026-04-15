// GET /api/storefront/locations — store branches / pickup points
import { defineStorefrontHandler } from '../../utils/storefrontHandler'

export default defineStorefrontHandler(async (_event, { adapter }) => {
  return adapter.getStoreLocations()
})
