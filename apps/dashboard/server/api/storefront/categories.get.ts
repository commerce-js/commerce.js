// GET /api/storefront/categories — category tree for the resolved merchant
import { defineStorefrontHandler } from '../../utils/storefrontHandler'

export default defineStorefrontHandler(async (event, { adapter }) => {
  const query = getQuery(event)
  return adapter.getCategories({
    parentId: query.parentId as string | undefined,
    depth: query.depth ? Number(query.depth) : undefined,
  })
})
