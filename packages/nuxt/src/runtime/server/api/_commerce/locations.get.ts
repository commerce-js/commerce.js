
defineRouteMeta({
  openAPI: {
    tags: ['Geography'],
    description: 'List store locations (branches, warehouses, pickup points)',
  },
})

export default defineCommerceHandler(async (_event, adapter) => {
  return adapter.getStoreLocations()
})
