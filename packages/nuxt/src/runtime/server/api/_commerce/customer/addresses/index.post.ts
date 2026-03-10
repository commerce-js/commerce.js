import { defineCommerceHandler } from '#imports'
import { readBody } from 'h3'

export default defineCommerceHandler(async (event, adapter) => {
  const body = addAddressSchema.parse(await readBody(event))
  return adapter.addAddress(body)
})
