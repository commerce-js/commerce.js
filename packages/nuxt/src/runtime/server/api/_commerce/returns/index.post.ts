import { readBody } from 'h3'

defineRouteMeta({
  openAPI: {
    tags: ['Returns'],
    description: 'Create a new return request',
  },
})

export default defineCommerceHandler(async (event, adapter) => {
  const body = createReturnSchema.parse(await readBody(event))
  return adapter.createReturn(body)
})
