import { readBody } from 'h3'

defineRouteMeta({
  openAPI: {
    tags: ['Auth'],
    description: 'Authenticate a customer with email and password',
  },
})

export default defineCommerceHandler(async (event, adapter) => {
  const { email, password } = loginSchema.parse(await readBody(event))
  return adapter.login(email, password)
})
