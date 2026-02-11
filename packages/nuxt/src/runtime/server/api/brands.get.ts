import { defineEventHandler } from 'h3'
import { useServerAdapter } from '../utils/adapter'

export default defineEventHandler(async (event) => {
  const adapter = useServerAdapter(event)

  return adapter.getBrands()
})
