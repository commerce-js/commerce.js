
defineRouteMeta({
  openAPI: {
    tags: ['Addresses'],
    description: 'List all addresses for the current customer',
  },
})

export default defineCommerceHandler(async (_event, adapter) => {
  return adapter.getAddresses()
})
