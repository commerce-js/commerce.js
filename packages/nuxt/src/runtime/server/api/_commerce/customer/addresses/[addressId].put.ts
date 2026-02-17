import { getRouterParam, readBody } from 'h3'

defineRouteMeta({
  openAPI: {
    tags: ['Addresses'],
    description: 'Update an existing customer address',
    parameters: [
      { in: 'path', name: 'addressId', required: true, description: 'Address ID' },
    ],
  },
})

export default defineCommerceHandler(async (event, adapter) => {
  const addressId = getRouterParam(event, 'addressId')!
  const body = updateAddressSchema.parse(await readBody(event))
  return adapter.updateAddress(addressId, body)
})
