import { defineCommerceHandler } from '@commercejs/nuxt/runtime/server/utils/handler.js'
import { readBody } from 'h3'

export default defineCommerceHandler(async (event) => {
  const body = estimateDeliverySchema.parse(await readBody(event))
  const { providerId, ...input } = body
  const provider = useServerDeliveryProvider(event, providerId)
  return provider.estimate(input)
})
