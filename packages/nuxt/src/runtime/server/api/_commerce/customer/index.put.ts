import { readBody } from 'h3'

defineRouteMeta({
  openAPI: {
    tags: ['Customer'],
    description: 'Update the current customer profile',
  },
})

export default defineCommerceHandler(async (event, adapter) => {
  const body = updateCustomerSchema.parse(await readBody(event))
  return adapter.updateCustomer(body)
})
