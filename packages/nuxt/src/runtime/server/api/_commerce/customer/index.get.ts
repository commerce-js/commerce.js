
defineRouteMeta({
  openAPI: {
    tags: ['Customer'],
    description: 'Get the currently authenticated customer profile',
  },
})

export default defineCommerceHandler(async (_event, adapter) => {
  return adapter.getCustomer()
})
