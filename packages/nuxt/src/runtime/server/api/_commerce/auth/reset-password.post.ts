import { readBody } from 'h3'

defineRouteMeta({
  openAPI: {
    tags: ['Auth'],
    description: 'Reset password using a reset token',
  },
})

export default defineCommerceHandler(async (event, adapter) => {
  const { token, password } = resetPasswordSchema.parse(await readBody(event))
  return adapter.resetPassword(token, password)
})
