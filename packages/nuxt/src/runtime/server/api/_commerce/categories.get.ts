import { defineCommerceHandler } from '#imports'
import { getQuery } from 'h3'

export default defineCommerceHandler(async (event, adapter) => {
  const query = getQuery(event)
  return adapter.getCategories({
    parentId: query.parentId as string | undefined,
    depth: query.depth ? Number(query.depth) : undefined,
  })
})
