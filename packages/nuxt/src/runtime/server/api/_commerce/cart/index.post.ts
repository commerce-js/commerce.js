
defineRouteMeta({
  openAPI: {
    tags: ['Cart'],
    description: 'Create a new shopping cart',
  },
})

export default defineCommerceHandler(async (_event, adapter) => {
  return adapter.createCart()
})
