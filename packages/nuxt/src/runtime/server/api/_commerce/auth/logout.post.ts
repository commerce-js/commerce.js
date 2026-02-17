
defineRouteMeta({
  openAPI: {
    tags: ['Auth'],
    description: 'Log out the current customer session',
  },
})

export default defineCommerceHandler(async (_event, adapter) => {
  return adapter.logout()
})
