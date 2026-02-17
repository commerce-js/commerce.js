import { readBody } from 'h3'

defineRouteMeta({
  openAPI: {
    tags: ['Auth'],
    description: 'Request a password reset email',
  },
})

export default defineCommerceHandler(async (event, adapter) => {
  const { email } = forgotPasswordSchema.parse(await readBody(event))
  return adapter.forgotPassword(email)
})
