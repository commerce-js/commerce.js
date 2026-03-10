
export default defineCommerceHandler(async (event, adapter) => {
  const { productId, variantId } = addToWishlistSchema.parse(await readBody(event))
  return adapter.addToWishlist(productId, variantId)
})
