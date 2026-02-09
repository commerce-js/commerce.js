import { defineEventHandler, getQuery } from 'h3'
import { useServerAdapter } from '../utils/adapter'

export default defineEventHandler(async (event) => {
  const adapter = useServerAdapter(event)
  const { page, perPage } = getQuery(event)

  return adapter.getReturns({
    page: page ? Number(page) : undefined,
    perPage: perPage ? Number(perPage) : undefined,
  })
})
