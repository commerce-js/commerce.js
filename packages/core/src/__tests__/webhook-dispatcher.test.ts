import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Mock } from 'vitest'
import { createWebhookDispatcher } from '../webhook-dispatcher.js'
import { CommerceEventBus } from '../event-bus.js'
import type { CommerceEvents } from '../events.js'

/** Read the plain-object headers the dispatcher sends on a given mock call */
function headersOf(call: unknown[]): Record<string, string> {
  return (call[1] as RequestInit).headers as Record<string, string>
}

describe('createWebhookDispatcher', () => {
  let bus: CommerceEventBus<CommerceEvents>
  let mockFetch: Mock<typeof fetch>

  beforeEach(() => {
    bus = new CommerceEventBus<CommerceEvents>()
    mockFetch = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 200 }))
  })

  it('should dispatch events to subscribed endpoints', async () => {
    createWebhookDispatcher(bus, {
      endpoints: [{
        id: 'test',
        url: 'https://example.com/hook',
        events: ['order.created'],
      }],
      fetch: mockFetch,
    })

    await bus.emit('order.created', { order: { id: 'ord_1' } as any })

    expect(mockFetch).toHaveBeenCalledOnce()
    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/hook',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"order.created"'),
      }),
    )
  })

  it('should NOT dispatch events to unsubscribed endpoints', async () => {
    createWebhookDispatcher(bus, {
      endpoints: [{
        id: 'test',
        url: 'https://example.com/hook',
        events: ['order.created'],
      }],
      fetch: mockFetch,
    })

    await bus.emit('cart.created', { cart: {} as any })

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should dispatch to wildcard endpoints on any event', async () => {
    createWebhookDispatcher(bus, {
      endpoints: [{
        id: 'analytics',
        url: 'https://analytics.example.com/hook',
        events: ['*'],
      }],
      fetch: mockFetch,
    })

    await bus.emit('order.created', { order: { id: 'ord_1' } as any })
    await bus.emit('cart.created', { cart: {} as any })

    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('should skip inactive endpoints', async () => {
    createWebhookDispatcher(bus, {
      endpoints: [{
        id: 'test',
        url: 'https://example.com/hook',
        events: ['order.created'],
        active: false,
      }],
      fetch: mockFetch,
    })

    await bus.emit('order.created', { order: { id: 'ord_1' } as any })

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should include custom headers', async () => {
    createWebhookDispatcher(bus, {
      endpoints: [{
        id: 'crm',
        url: 'https://crm.example.com/hook',
        events: ['order.created'],
      }],
      fetch: mockFetch,
    })

    await bus.emit('order.created', { order: { id: 'ord_1' } as any })

    const callArgs = mockFetch.mock.calls[0]
    const headers = headersOf(callArgs)
    expect(headers['X-Commerce-Event']).toBe('order.created')
    expect(headers['Content-Type']).toBe('application/json')
    expect(headers['X-Commerce-Delivery']).toBeDefined()
  })

  it('should sign payload when sign function and secret are provided', async () => {
    const sign = vi.fn().mockResolvedValue('sig_abc123')

    createWebhookDispatcher(bus, {
      endpoints: [{
        id: 'test',
        url: 'https://example.com/hook',
        events: ['order.created'],
        secret: 'my-secret',
      }],
      fetch: mockFetch,
      sign,
    })

    await bus.emit('order.created', { order: { id: 'ord_1' } as any })

    expect(sign).toHaveBeenCalledWith(expect.any(String), 'my-secret')
    const callArgs = mockFetch.mock.calls[0]
    expect(headersOf(callArgs)['X-Commerce-Signature']).toBe('sig_abc123')
  })

  it('should retry on 5xx errors', async () => {
    mockFetch
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))

    const { deliveries } = createWebhookDispatcher(bus, {
      endpoints: [{
        id: 'test',
        url: 'https://example.com/hook',
        events: ['order.created'],
      }],
      fetch: mockFetch,
      maxRetries: 3,
    })

    await bus.emit('order.created', { order: { id: 'ord_1' } as any })

    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(deliveries).toHaveLength(1)
    expect(deliveries[0].status).toBe('success')
    expect(deliveries[0].attempts).toBe(2)
  })

  it('should NOT retry on 4xx errors', async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 400 }))

    const { deliveries } = createWebhookDispatcher(bus, {
      endpoints: [{
        id: 'test',
        url: 'https://example.com/hook',
        events: ['order.created'],
      }],
      fetch: mockFetch,
      maxRetries: 3,
    })

    await bus.emit('order.created', { order: { id: 'ord_1' } as any })

    expect(mockFetch).toHaveBeenCalledOnce()
    expect(deliveries[0].status).toBe('failed')
  })

  it('should unsubscribe from all events on unsubscribe()', async () => {
    const { unsubscribe } = createWebhookDispatcher(bus, {
      endpoints: [{
        id: 'test',
        url: 'https://example.com/hook',
        events: ['order.created'],
      }],
      fetch: mockFetch,
    })

    unsubscribe()
    await bus.emit('order.created', { order: { id: 'ord_1' } as any })

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should track delivery records', async () => {
    const { deliveries } = createWebhookDispatcher(bus, {
      endpoints: [{
        id: 'test',
        url: 'https://example.com/hook',
        events: ['order.created'],
      }],
      fetch: mockFetch,
    })

    await bus.emit('order.created', { order: { id: 'ord_1' } as any })

    expect(deliveries).toHaveLength(1)
    expect(deliveries[0]).toMatchObject({
      endpointId: 'test',
      event: 'order.created',
      status: 'success',
      statusCode: 200,
      attempts: 1,
    })
  })
})
