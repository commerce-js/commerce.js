
defineRouteMeta({
  openAPI: {
    tags: ['Store'],
    description: 'Get store information (name, logo, currency, locale, etc.)',
  },
})

export default defineCommerceHandler(async (_event, adapter) => {
  return adapter.getStoreInfo()
})
