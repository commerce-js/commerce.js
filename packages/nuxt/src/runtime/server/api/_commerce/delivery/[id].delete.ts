import { getRouterParam, getQuery } from 'h3'
defineRouteMeta({
  openAPI: {
    tags: ['Delivery'],
    description: 'Cancel a pending or in-progress delivery',
  },
})

export default defineCommerceHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const { providerId } = getQuery(event) as { providerId?: string }
  const provider = useServerDeliveryProvider(event, providerId)
  return provider.cancelDelivery(id)
})
