
export default defineCommerceHandler(async (event, adapter) => {
  const body = createReturnSchema.parse(await readBody(event))
  return adapter.createReturn(body)
})
