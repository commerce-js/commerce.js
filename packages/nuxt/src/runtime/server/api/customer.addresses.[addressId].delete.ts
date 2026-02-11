import { defineEventHandler, getRouterParam } from 'h3'
import { useServerAdapter } from '../utils/adapter'

export default defineEventHandler(async (event) => {
  const adapter = useServerAdapter(event)
  const addressId = getRouterParam(event, 'addressId')!

  await adapter.deleteAddress(addressId)
  return { success: true }
})
