
export default defineCommerceHandler(async (event, adapter) => {
  const { email, password } = loginSchema.parse(await readBody(event))
  return adapter.login(email, password)
})
