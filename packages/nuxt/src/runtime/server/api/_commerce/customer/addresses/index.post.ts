import { readBody } from 'h3'

defineRouteMeta({
  openAPI: {
    tags: ['Addresses'],
    description: 'Add a new address for the current customer',
  },
})

export default defineCommerceHandler(async (event, adapter) => {
  const body = addAddressSchema.parse(await readBody(event))
  return adapter.addAddress(body)
})
