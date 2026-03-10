import { defineCommerceHandler } from '@commercejs/nuxt/runtime/server/utils/handler.js'
import { getQuery } from 'h3'

export default defineCommerceHandler(async (event, adapter) => {
  const query = getQuery(event)
  return adapter.getCustomerOrders({
    page: query.page ? Number(query.page) : undefined,
    perPage: query.perPage ? Number(query.perPage) : undefined,
  })
})
