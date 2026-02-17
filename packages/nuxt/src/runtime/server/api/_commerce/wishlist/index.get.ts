
defineRouteMeta({
  openAPI: {
    tags: ['Wishlist'],
    description: 'Get the current customer wishlist',
  },
})

export default defineCommerceHandler(async (_event, adapter) => {
  return adapter.getWishlist()
})
