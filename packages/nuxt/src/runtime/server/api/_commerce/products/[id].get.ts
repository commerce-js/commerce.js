import { defineCommerceHandler } from '#imports'
import { getRouterParam } from 'h3'

export default defineCommerceHandler(async (event, adapter) => {
  const idOrSlug = getRouterParam(event, 'id')!

  // If the param looks like a slug (contains hyphens / not a pure ID), use slug lookup
  const isSlug = idOrSlug.includes('-') || !/^[a-f0-9]{16,}$/.test(idOrSlug)

  return adapter.getProduct(isSlug ? { slug: idOrSlug } : { id: idOrSlug })
})
