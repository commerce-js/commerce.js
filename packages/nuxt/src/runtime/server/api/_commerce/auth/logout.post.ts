import { defineCommerceHandler } from '../../utils/handler'

export default defineCommerceHandler(async (_event, adapter) => {
  return adapter.logout()
})
