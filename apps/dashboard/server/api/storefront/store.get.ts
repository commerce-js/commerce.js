// GET /api/storefront/store — store metadata (name, currency, locale, etc.)
import { defineStorefrontHandler } from '../../utils/storefrontHandler'

export default defineStorefrontHandler(async (_event, { adapter }) => {
  return adapter.getStoreInfo()
})
