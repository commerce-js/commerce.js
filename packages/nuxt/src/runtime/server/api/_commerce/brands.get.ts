
defineRouteMeta({
  openAPI: {
    tags: ['Catalog'],
    description: 'List all brands',
  },
})

export default defineCommerceHandler(async (_event, adapter) => {
  return adapter.getBrands()
})
