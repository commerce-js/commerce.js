import { readBody } from 'h3'

defineRouteMeta({
  openAPI: {
    tags: ['Auth'],
    description: 'Register a new customer account',
  },
})

export default defineCommerceHandler(async (event, adapter) => {
  const body = registerSchema.parse(await readBody(event))
  return adapter.register(body)
})
