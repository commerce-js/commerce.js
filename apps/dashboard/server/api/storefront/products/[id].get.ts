// GET /api/storefront/products/:id — product by ID or slug
import { defineStorefrontHandler } from '../../../utils/storefrontHandler'

export default defineStorefrontHandler(async (event, { adapter }) => {
  const idOrSlug = getRouterParam(event, 'id')!
  // Slugs generally contain hyphens; pure hex IDs are >= 16 chars
  const isSlug = idOrSlug.includes('-') || !/^[a-f0-9]{16,}$/.test(idOrSlug)
  return adapter.getProduct(isSlug ? { slug: idOrSlug } : { id: idOrSlug })
})
