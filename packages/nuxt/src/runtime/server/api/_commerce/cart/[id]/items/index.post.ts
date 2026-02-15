import { getRouterParam, readBody } from 'h3'

export default defineCommerceHandler(async (event, adapter) => {
  const id = getRouterParam(event, 'id')!
  const body = addToCartSchema.parse(await readBody(event))
  return adapter.addToCart(id, body)
})
