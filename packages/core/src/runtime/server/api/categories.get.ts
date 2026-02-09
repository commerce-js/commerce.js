import { defineEventHandler, getQuery } from 'h3'
import { useServerAdapter } from '../utils/adapter'

export default defineEventHandler(async (event) => {
  const adapter = useServerAdapter(event)
  const query = getQuery(event)

  return adapter.getCategories({
    parentId: query.parentId as string | undefined,
    depth: query.depth ? Number(query.depth) : undefined,
  })
})
