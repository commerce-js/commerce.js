// ---------------------------------------------------------------------------
// @commercejs/core — Typed Event Bus
// ---------------------------------------------------------------------------
// Zero-dependency, synchronous event bus with strong typing.
// Similar to the EventEmitter in @commercejs/checkout but public (not
// protected emit) and designed for the orchestration layer.
// ---------------------------------------------------------------------------

/** Subscriber function type */
export type EventHandler<T = unknown> = (data: T) => void | Promise<void>

/** Wildcard handler receives event name + data */
export type WildcardHandler = (event: string, data: unknown) => void | Promise<void>

/**
 * Typed event bus — in-process pub/sub for commerce events.
 *
 * @example
 * ```ts
 * const bus = new CommerceEventBus<CommerceEvents>()
 * bus.on('order.created', (order) => sendConfirmationEmail(order))
 * bus.on('*', (event, data) => console.log(`[${event}]`, data))
 * bus.emit('order.created', order)
 * ```
 */
export class CommerceEventBus<TEvents extends { [key: string]: unknown }> {
  private listeners = new Map<keyof TEvents, Set<EventHandler>>()
  private wildcardListeners = new Set<WildcardHandler>()

  /**
   * Subscribe to a specific event. Returns an unsubscribe function.
   */
  on<K extends keyof TEvents & string>(event: K, fn: EventHandler<TEvents[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    const set = this.listeners.get(event)!
    set.add(fn as EventHandler)

    return () => {
      set.delete(fn as EventHandler)
    }
  }

  /**
   * Subscribe to ALL events (wildcard). Handler receives (eventName, data).
   */
  onAny(fn: WildcardHandler): () => void {
    this.wildcardListeners.add(fn)
    return () => {
      this.wildcardListeners.delete(fn)
    }
  }

  /**
   * Subscribe to an event, but only fire once.
   */
  once<K extends keyof TEvents & string>(event: K, fn: EventHandler<TEvents[K]>): () => void {
    const unsub = this.on(event, (data) => {
      unsub()
      fn(data)
    })
    return unsub
  }

  /**
   * Emit an event. Runs all listeners synchronously, but awaits async handlers.
   */
  async emit<K extends keyof TEvents & string>(event: K, data: TEvents[K]): Promise<void> {
    // Specific listeners
    const set = this.listeners.get(event)
    if (set) {
      for (const fn of set) {
        await (fn as EventHandler<TEvents[K]>)(data)
      }
    }

    // Wildcard listeners
    for (const fn of this.wildcardListeners) {
      await fn(event, data)
    }
  }

  /**
   * Remove all listeners (useful for cleanup / testing).
   */
  removeAllListeners(): void {
    this.listeners.clear()
    this.wildcardListeners.clear()
  }
}
