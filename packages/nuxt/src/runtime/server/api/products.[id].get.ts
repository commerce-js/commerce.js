import { defineEventHandler, getRouterParam } from 'h3'
import { useServerAdapter } from '../utils/adapter'

export default defineEventHandler(async (event) => {
  const adapter = useServerAdapter(event)
  const idOrSlug = getRouterParam(event, 'id')!

  // If the param looks like a slug (contains hyphens / not a pure ID), use slug lookup
  const isSlug = idOrSlug.includes('-') || !/^[a-f0-9]{16,}$/.test(idOrSlug)

  return adapter.getProduct(isSlug ? { slug: idOrSlug } : { id: idOrSlug })
})
