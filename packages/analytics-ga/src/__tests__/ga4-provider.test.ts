import { describe, it, expect, vi } from 'vitest'
import { createGA4Provider } from '../ga4-provider.js'

describe('GA4AnalyticsProvider', () => {
  const mockGtag = vi.fn()

  function createProvider(overrides?: Record<string, unknown>) {
    return createGA4Provider({
      measurementId: 'G-TEST123',
      gtag: mockGtag,
      ...overrides,
    })
  }

  it('has correct metadata', () => {
    const provider = createProvider()
    expect(provider.id).toBe('ga4')
    expect(provider.name).toBe('Google Analytics 4')
  })

  it('initializes GA4 config on first event', () => {
    const provider = createProvider()
    provider.track('test.event', { foo: 'bar' })

    // First call = config, second call = event
    expect(mockGtag).toHaveBeenCalledTimes(2)
    expect(mockGtag).toHaveBeenNthCalledWith(1, 'config', 'G-TEST123', {
      send_page_view: false,
    })
  })

  it('sends config only once', () => {
    const provider = createProvider()
    provider.track('event.one')
    provider.track('event.two')

    // 1 config + 2 events = 3 calls
    expect(mockGtag).toHaveBeenCalledTimes(3)
  })

  // --- track() ---

  it('maps commerce events to GA4 recommended events', () => {
    const provider = createProvider()
    provider.track('product.viewed', { product: { id: '123' } })

    expect(mockGtag).toHaveBeenLastCalledWith('event', 'view_item', {
      product: { id: '123' },
    })
  })

  it('maps cart.item.added to add_to_cart', () => {
    const provider = createProvider()
    provider.track('cart.item.added', { productId: 'p1', quantity: 2 })

    expect(mockGtag).toHaveBeenLastCalledWith('event', 'add_to_cart', {
      productId: 'p1',
      quantity: 2,
    })
  })

  it('maps order.created to purchase', () => {
    const provider = createProvider()
    provider.track('order.created', { orderId: 'ord_1' })

    expect(mockGtag).toHaveBeenLastCalledWith('event', 'purchase', {
      orderId: 'ord_1',
    })
  })

  it('maps customer.registered to sign_up', () => {
    const provider = createProvider()
    provider.track('customer.registered', { email: 'test@test.com' })

    expect(mockGtag).toHaveBeenLastCalledWith('event', 'sign_up', {
      email: 'test@test.com',
    })
  })

  it('converts unmapped events to underscore format', () => {
    const provider = createProvider()
    provider.track('wishlist.item.added', { itemId: 'w1' })

    expect(mockGtag).toHaveBeenLastCalledWith('event', 'wishlist_item_added', {
      itemId: 'w1',
    })
  })

  // --- identify() ---

  it('sets user properties via gtag', () => {
    const provider = createProvider()
    provider.identify('user_123', { email: 'test@test.com', name: 'Test' })

    expect(mockGtag).toHaveBeenCalledWith('set', 'user_properties', {
      user_id: 'user_123',
      email: 'test@test.com',
      name: 'Test',
    })
  })

  // --- page() ---

  it('tracks page views', () => {
    const provider = createProvider()
    provider.page('Product Detail', { url: '/products/shirt' })

    expect(mockGtag).toHaveBeenCalledWith('event', 'page_view', {
      page_title: 'Product Detail',
      url: '/products/shirt',
    })
  })

  // --- debug mode ---

  it('adds debug_mode when configured', () => {
    const provider = createProvider({ debug: true })
    provider.track('test.event', { foo: 'bar' })

    // Config call includes debug
    expect(mockGtag).toHaveBeenNthCalledWith(1, 'config', 'G-TEST123', {
      send_page_view: false,
      debug_mode: true,
    })

    // Event call includes debug
    expect(mockGtag).toHaveBeenLastCalledWith('event', 'test_event', {
      foo: 'bar',
      debug_mode: true,
    })
  })

  // --- SSR safety ---

  it('does nothing when gtag is not available', () => {
    const provider = createGA4Provider({ measurementId: 'G-TEST' })
    // No gtag in globalThis in test env — should not throw
    expect(() => provider.track('test.event')).not.toThrow()
    expect(() => provider.identify('user_1')).not.toThrow()
    expect(() => provider.page('Home')).not.toThrow()
  })
})
