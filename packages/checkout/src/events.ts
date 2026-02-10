// ---------------------------------------------------------------------------
// Tiny typed event emitter — zero dependencies, < 40 lines
// ---------------------------------------------------------------------------

/** Generic typed event emitter */
export class EventEmitter<TEvents extends { [K in keyof TEvents]: unknown }> {
  private listeners = new Map<keyof TEvents, Set<(data: never) => void>>()

  /** Subscribe to an event. Returns an unsubscribe function. */
  on<K extends keyof TEvents>(event: K, fn: (data: TEvents[K]) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    const set = this.listeners.get(event)!
    set.add(fn as (data: never) => void)

    return () => {
      set.delete(fn as (data: never) => void)
    }
  }

  /** Subscribe to an event, but only fire once */
  once<K extends keyof TEvents>(event: K, fn: (data: TEvents[K]) => void): () => void {
    const unsub = this.on(event, (data) => {
      unsub()
      fn(data)
    })
    return unsub
  }

  /** Emit an event to all listeners */
  protected emit<K extends keyof TEvents>(event: K, data: TEvents[K]): void {
    const set = this.listeners.get(event)
    if (!set) return
    for (const fn of set) {
      (fn as (data: TEvents[K]) => void)(data)
    }
  }

  /** Remove all listeners (useful for cleanup) */
  removeAllListeners(): void {
    this.listeners.clear()
  }
}
