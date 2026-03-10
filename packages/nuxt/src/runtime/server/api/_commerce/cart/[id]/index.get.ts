
export default defineCommerceHandler(async (event, adapter) => {
  const id = getRouterParam(event, 'id')!
  return adapter.getCart(id)
})
