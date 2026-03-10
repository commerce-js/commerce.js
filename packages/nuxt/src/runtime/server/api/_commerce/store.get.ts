import { defineCommerceHandler } from '@commercejs/nuxt/runtime/server/utils/handler.js'

export default defineCommerceHandler(async (_event, adapter) => {
  return adapter.getStoreInfo()
})
