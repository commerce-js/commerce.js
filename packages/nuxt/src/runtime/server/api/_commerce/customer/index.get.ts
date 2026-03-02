

export default defineCommerceHandler(async (_event, adapter) => {
  return adapter.getCustomer()
})
