import { defineCommerceHandler } from '../../utils/handler'
import { readBody } from 'h3'

export default defineCommerceHandler(async (event, adapter) => {
  const body = updateCustomerSchema.parse(await readBody(event))
  return adapter.updateCustomer(body)
})
