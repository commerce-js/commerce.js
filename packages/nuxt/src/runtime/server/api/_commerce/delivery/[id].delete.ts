import { defineCommerceHandler } from '../../utils/handler'
import { getQuery, getRouterParam } from 'h3'

export default defineCommerceHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const { providerId } = getQuery(event) as { providerId?: string }
  const provider = useServerDeliveryProvider(event, providerId)
  return provider.cancelDelivery(id)
})
