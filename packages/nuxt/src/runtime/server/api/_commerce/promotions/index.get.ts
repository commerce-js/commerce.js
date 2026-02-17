
defineRouteMeta({
  openAPI: {
    tags: ['Promotions'],
    description: 'List active promotions',
  },
})

export default defineCommerceHandler(async (_event, adapter) => {
  return adapter.getActivePromotions()
})
