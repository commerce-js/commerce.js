import { defineCommerceHandler } from '../../utils/handler'
import { readBody } from 'h3'

export default defineCommerceHandler(async (event, adapter) => {
  const { email } = forgotPasswordSchema.parse(await readBody(event))
  return adapter.forgotPassword(email)
})
