import { describe, it, expect, vi } from 'vitest'
import { CommerceEventBus } from '../event-bus.js'

interface TestEvents {
  'item.added': { id: string; name: string }
  'item.removed': { id: string }
  'count.changed': number
  [key: string]: unknown
}

describe('CommerceEventBus', () => {
  it('should call listener when event is emitted', async () => {
    const bus = new CommerceEventBus<TestEvents>()
    const handler = vi.fn()

    bus.on('item.added', handler)
    await bus.emit('item.added', { id: '1', name: 'Test' })

    expect(handler).toHaveBeenCalledOnce()
    expect(handler).toHaveBeenCalledWith({ id: '1', name: 'Test' })
  })

  it('should return unsubscribe function', async () => {
    const bus = new CommerceEventBus<TestEvents>()
    const handler = vi.fn()

    const unsub = bus.on('item.added', handler)
    unsub()
    await bus.emit('item.added', { id: '1', name: 'Test' })

    expect(handler).not.toHaveBeenCalled()
  })

  it('should support multiple listeners', async () => {
    const bus = new CommerceEventBus<TestEvents>()
    const handler1 = vi.fn()
    const handler2 = vi.fn()

    bus.on('item.added', handler1)
    bus.on('item.added', handler2)
    await bus.emit('item.added', { id: '1', name: 'Test' })

    expect(handler1).toHaveBeenCalledOnce()
    expect(handler2).toHaveBeenCalledOnce()
  })

  it('should fire once() listener only once', async () => {
    const bus = new CommerceEventBus<TestEvents>()
    const handler = vi.fn()

    bus.once('item.added', handler)
    await bus.emit('item.added', { id: '1', name: 'First' })
    await bus.emit('item.added', { id: '2', name: 'Second' })

    expect(handler).toHaveBeenCalledOnce()
    expect(handler).toHaveBeenCalledWith({ id: '1', name: 'First' })
  })

  it('should fire wildcard listeners on every event', async () => {
    const bus = new CommerceEventBus<TestEvents>()
    const handler = vi.fn()

    bus.onAny(handler)
    await bus.emit('item.added', { id: '1', name: 'Test' })
    await bus.emit('item.removed', { id: '1' })

    expect(handler).toHaveBeenCalledTimes(2)
    expect(handler).toHaveBeenCalledWith('item.added', { id: '1', name: 'Test' })
    expect(handler).toHaveBeenCalledWith('item.removed', { id: '1' })
  })

  it('should allow unsubscribing wildcard listener', async () => {
    const bus = new CommerceEventBus<TestEvents>()
    const handler = vi.fn()

    const unsub = bus.onAny(handler)
    unsub()
    await bus.emit('item.added', { id: '1', name: 'Test' })

    expect(handler).not.toHaveBeenCalled()
  })

  it('should removeAllListeners', async () => {
    const bus = new CommerceEventBus<TestEvents>()
    const handler1 = vi.fn()
    const handler2 = vi.fn()

    bus.on('item.added', handler1)
    bus.onAny(handler2)
    bus.removeAllListeners()
    await bus.emit('item.added', { id: '1', name: 'Test' })

    expect(handler1).not.toHaveBeenCalled()
    expect(handler2).not.toHaveBeenCalled()
  })

  it('should await async listeners', async () => {
    const bus = new CommerceEventBus<TestEvents>()
    const order: string[] = []

    bus.on('count.changed', async () => {
      await new Promise(r => setTimeout(r, 10))
      order.push('async')
    })
    bus.on('count.changed', () => {
      order.push('sync')
    })

    await bus.emit('count.changed', 42)
    expect(order).toEqual(['async', 'sync'])
  })

  it('should not throw when emitting event with no listeners', async () => {
    const bus = new CommerceEventBus<TestEvents>()
    await expect(bus.emit('item.added', { id: '1', name: 'Test' })).resolves.toBeUndefined()
  })
})
