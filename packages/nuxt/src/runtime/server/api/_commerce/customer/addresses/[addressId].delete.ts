import { getRouterParam } from 'h3'

defineRouteMeta({
  openAPI: {
    tags: ['Addresses'],
    description: 'Delete a customer address',
    parameters: [
      { in: 'path', name: 'addressId', required: true, description: 'Address ID' },
    ],
  },
})

export default defineCommerceHandler(async (event, adapter) => {
  const addressId = getRouterParam(event, 'addressId')!
  return adapter.deleteAddress(addressId)
})
