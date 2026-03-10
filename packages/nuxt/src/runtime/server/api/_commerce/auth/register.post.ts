
export default defineCommerceHandler(async (event, adapter) => {
  const body = registerSchema.parse(await readBody(event))
  return adapter.register(body)
})
