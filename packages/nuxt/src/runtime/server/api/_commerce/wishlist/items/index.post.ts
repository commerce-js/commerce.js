import { readBody } from 'h3'

defineRouteMeta({
  openAPI: {
    tags: ['Wishlist'],
    description: 'Add a product to the wishlist',
  },
})

export default defineCommerceHandler(async (event, adapter) => {
  const { productId, variantId } = addToWishlistSchema.parse(await readBody(event))
  return adapter.addToWishlist(productId, variantId)
})
