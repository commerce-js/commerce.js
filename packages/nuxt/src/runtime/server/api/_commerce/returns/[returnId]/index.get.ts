import { getRouterParam } from 'h3'

defineRouteMeta({
  openAPI: {
    tags: ['Returns'],
    description: 'Get a specific return request by ID',
    parameters: [
      { in: 'path', name: 'returnId', required: true, description: 'Return ID' },
    ],
  },
})

export default defineCommerceHandler(async (event, adapter) => {
  const returnId = getRouterParam(event, 'returnId')!
  return adapter.getReturn(returnId)
})
