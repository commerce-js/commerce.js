
export default defineCommerceHandler(async (event, adapter) => {
  const itemId = getRouterParam(event, 'itemId')!
  return adapter.removeFromWishlist(itemId)
})
