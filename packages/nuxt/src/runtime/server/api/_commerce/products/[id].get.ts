import { getRouterParam } from 'h3'

defineRouteMeta({
  openAPI: {
    tags: ['Catalog'],
    description: 'Get a single product by ID or slug',
    parameters: [
      { in: 'path', name: 'id', required: true, description: 'Product ID or slug' },
    ],
  },
})

export default defineCommerceHandler(async (event, adapter) => {
  const idOrSlug = getRouterParam(event, 'id')!

  // If the param looks like a slug (contains hyphens / not a pure ID), use slug lookup
  const isSlug = idOrSlug.includes('-') || !/^[a-f0-9]{16,}$/.test(idOrSlug)

  return adapter.getProduct(isSlug ? { slug: idOrSlug } : { id: idOrSlug })
})
