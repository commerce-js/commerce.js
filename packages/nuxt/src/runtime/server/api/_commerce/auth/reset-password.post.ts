import { readBody } from 'h3'

export default defineCommerceHandler(async (event, adapter) => {
  const { token, password } = resetPasswordSchema.parse(await readBody(event))
  return adapter.resetPassword(token, password)
})
