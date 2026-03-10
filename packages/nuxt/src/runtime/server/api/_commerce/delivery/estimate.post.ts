import { defineCommerceHandler } from '../../utils/handler'
import { readBody } from 'h3'

export default defineCommerceHandler(async (event) => {
  const body = estimateDeliverySchema.parse(await readBody(event))
  const { providerId, ...input } = body
  const provider = useServerDeliveryProvider(event, providerId)
  return provider.estimate(input)
})
