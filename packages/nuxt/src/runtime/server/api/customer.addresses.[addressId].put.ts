import { defineEventHandler, readBody, getRouterParam } from 'h3'
import { useServerAdapter } from '../utils/adapter'

export default defineEventHandler(async (event) => {
  const adapter = useServerAdapter(event)
  const addressId = getRouterParam(event, 'addressId')!
  const address = await readBody(event)

  return adapter.updateAddress(addressId, address)
})
