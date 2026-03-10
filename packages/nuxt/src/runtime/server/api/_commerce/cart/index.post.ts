import { defineCommerceHandler } from '@commercejs/nuxt/runtime/server/utils/handler'

export default defineCommerceHandler(async (_event, adapter) => {
  return adapter.createCart()
})
