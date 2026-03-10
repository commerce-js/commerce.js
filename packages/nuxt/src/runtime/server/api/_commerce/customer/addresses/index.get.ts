import { defineCommerceHandler } from '#imports'

export default defineCommerceHandler(async (_event, adapter) => {
  return adapter.getAddresses()
})
