import { getRouterParam } from 'h3'

defineRouteMeta({
  openAPI: {
    tags: ['Wishlist'],
    description: 'Remove an item from the wishlist',
    parameters: [
      { in: 'path', name: 'itemId', required: true, description: 'Wishlist item ID' },
    ],
  },
})

export default defineCommerceHandler(async (event, adapter) => {
  const itemId = getRouterParam(event, 'itemId')!
  return adapter.removeFromWishlist(itemId)
})
