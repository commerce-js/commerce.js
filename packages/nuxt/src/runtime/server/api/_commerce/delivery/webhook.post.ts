import { readBody, readRawBody, getHeader } from 'h3'


export default defineCommerceHandler(async (event) => {
  const { providerId } = deliveryWebhookSchema.parse(await readBody(event).catch(() => ({
    providerId: getHeader(event, 'x-delivery-provider'),
  })))

  const provider = useServerDeliveryProvider(event, providerId)

  if (!provider.verifyWebhook) {
    throw createError({
      statusCode: 501,
      message: `Delivery provider "${provider.id}" does not support webhook verification.`,
    })
  }

  const rawBody = await readRawBody(event) || ''
  const signature = getHeader(event, 'x-webhook-signature')
    || getHeader(event, 'x-armada-signature')
    || getHeader(event, 'x-parcel-signature')
    || ''

  return provider.verifyWebhook(rawBody, signature)
})
