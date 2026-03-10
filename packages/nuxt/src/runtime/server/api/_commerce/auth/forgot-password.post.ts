
export default defineCommerceHandler(async (event, adapter) => {
  const { email } = forgotPasswordSchema.parse(await readBody(event))
  return adapter.forgotPassword(email)
})
