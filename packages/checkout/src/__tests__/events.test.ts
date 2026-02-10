import { describe, it, expect, vi } from 'vitest'
import { EventEmitter } from '../events.js'

describe('EventEmitter', () => {
  interface TestEvents {
    ping: { value: number }
    pong: { message: string }
  }

  // Expose emit for testing by subclassing
  class TestEmitter extends EventEmitter<TestEvents> {
    fire<K extends keyof TestEvents>(event: K, data: TestEvents[K]) {
      this.emit(event, data)
    }
  }

  it('calls listener on emit', () => {
    const emitter = new TestEmitter()
    const fn = vi.fn()
    emitter.on('ping', fn)
    emitter.fire('ping', { value: 42 })
    expect(fn).toHaveBeenCalledWith({ value: 42 })
  })

  it('supports multiple listeners', () => {
    const emitter = new TestEmitter()
    const fn1 = vi.fn()
    const fn2 = vi.fn()
    emitter.on('ping', fn1)
    emitter.on('ping', fn2)
    emitter.fire('ping', { value: 1 })
    expect(fn1).toHaveBeenCalledOnce()
    expect(fn2).toHaveBeenCalledOnce()
  })

  it('unsubscribes via returned function', () => {
    const emitter = new TestEmitter()
    const fn = vi.fn()
    const unsub = emitter.on('ping', fn)
    unsub()
    emitter.fire('ping', { value: 1 })
    expect(fn).not.toHaveBeenCalled()
  })

  it('once fires only once', () => {
    const emitter = new TestEmitter()
    const fn = vi.fn()
    emitter.once('ping', fn)
    emitter.fire('ping', { value: 1 })
    emitter.fire('ping', { value: 2 })
    expect(fn).toHaveBeenCalledOnce()
    expect(fn).toHaveBeenCalledWith({ value: 1 })
  })

  it('removeAllListeners clears everything', () => {
    const emitter = new TestEmitter()
    const fn = vi.fn()
    emitter.on('ping', fn)
    emitter.on('pong', fn)
    emitter.removeAllListeners()
    emitter.fire('ping', { value: 1 })
    emitter.fire('pong', { message: 'hi' })
    expect(fn).not.toHaveBeenCalled()
  })

  it('does not throw when emitting with no listeners', () => {
    const emitter = new TestEmitter()
    expect(() => emitter.fire('ping', { value: 1 })).not.toThrow()
  })
})
