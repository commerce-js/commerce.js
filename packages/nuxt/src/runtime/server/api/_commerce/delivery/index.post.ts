import { readBody } from 'h3'

defineRouteMeta({
  openAPI: {
    tags: ['Delivery'],
    description: 'Create a delivery task/order',
  },
})

export default defineCommerceHandler(async (event) => {
  const body = createDeliverySchema.parse(await readBody(event))
  const { providerId, ...input } = body
  const provider = useServerDeliveryProvider(event, providerId)
  return provider.createDelivery(input)
})
