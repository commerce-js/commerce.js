import { getRouterParam, getQuery } from 'h3'
import { useServerDeliveryProvider } from '../../utils/delivery'

defineRouteMeta({
  openAPI: {
    tags: ['Delivery'],
    description: 'Get current delivery status and details',
  },
})

export default defineCommerceHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const { providerId } = getQuery(event) as { providerId?: string }
  const provider = useServerDeliveryProvider(event, providerId)
  return provider.getDelivery(id)
})
