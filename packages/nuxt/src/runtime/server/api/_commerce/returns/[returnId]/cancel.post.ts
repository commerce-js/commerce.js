import { getRouterParam } from 'h3'

defineRouteMeta({
  openAPI: {
    tags: ['Returns'],
    description: 'Cancel a return request',
    parameters: [
      { in: 'path', name: 'returnId', required: true, description: 'Return ID' },
    ],
  },
})

export default defineCommerceHandler(async (event, adapter) => {
  const returnId = getRouterParam(event, 'returnId')!
  return adapter.cancelReturn(returnId)
})
