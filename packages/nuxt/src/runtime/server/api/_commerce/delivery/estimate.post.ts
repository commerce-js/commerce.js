import { readBody } from 'h3'
import { useServerDeliveryProvider } from '../../utils/delivery'

defineRouteMeta({
  openAPI: {
    tags: ['Delivery'],
    description: 'Estimate delivery fee and time without creating a delivery',
  },
})

export default defineCommerceHandler(async (event) => {
  const body = estimateDeliverySchema.parse(await readBody(event))
  const { providerId, ...input } = body
  const provider = useServerDeliveryProvider(event, providerId)
  return provider.estimate(input)
})
