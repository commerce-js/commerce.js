// GET /api/storefront/brands — product brands for the resolved merchant
import { defineStorefrontHandler } from '../../utils/storefrontHandler'

export default defineStorefrontHandler(async (_event, { adapter }) => {
  return adapter.getBrands()
})
