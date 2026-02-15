import { describe, it, expect, vi } from 'vitest'
import { createOrchestrator } from '../orchestrator.js'
import { createCompositeOrchestrator } from '../composite.js'
import { withPlatformFallback } from '../fallback.js'
import { CommerceError } from '@commercejs/types'
import type { CatalogAdapter, StoreAdapter, CartAdapter, CustomerAdapter, DomainMap } from '@commercejs/types'

// ---- Helpers ----

function mockCatalog(overrides: Partial<CatalogAdapter> = {}): CatalogAdapter {
  return {
    getProduct: vi.fn().mockResolvedValue({ id: 'prod_1', name: 'Test Product' }),
    getProducts: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 }),
    getCategories: vi.fn().mockResolvedValue([]),
    ...overrides,
  }
}

function mockStore(overrides: Partial<StoreAdapter> = {}): StoreAdapter {
  return {
    getStoreInfo: vi.fn().mockResolvedValue({ name: 'Test Store' }),
    ...overrides,
  }
}

function mockCart(overrides: Partial<CartAdapter> = {}): CartAdapter {
  return {
    createCart: vi.fn().mockResolvedValue({ id: 'cart_1', items: [], totals: {} }),
    getCart: vi.fn().mockResolvedValue({ id: 'cart_1', items: [], totals: {} }),
    addToCart: vi.fn().mockResolvedValue({ id: 'cart_1', items: [], totals: {} }),
    updateCartItem: vi.fn().mockResolvedValue({ id: 'cart_1', items: [], totals: {} }),
    removeFromCart: vi.fn().mockResolvedValue({ id: 'cart_1', items: [], totals: {} }),
    applyCoupon: vi.fn().mockResolvedValue({ id: 'cart_1', items: [], totals: {} }),
    removeCoupon: vi.fn().mockResolvedValue({ id: 'cart_1', items: [], totals: {} }),
    ...overrides,
  }
}

function mockCustomer(): CustomerAdapter {
  return {
    login: vi.fn().mockResolvedValue({ id: 'cust_1', email: 'test@example.com' }),
    register: vi.fn().mockResolvedValue({ id: 'cust_1' }),
    getCustomer: vi.fn().mockResolvedValue({ id: 'cust_1' }),
    updateCustomer: vi.fn().mockResolvedValue({ id: 'cust_1' }),
    logout: vi.fn().mockResolvedValue(undefined),
    forgotPassword: vi.fn().mockResolvedValue(undefined),
    resetPassword: vi.fn().mockResolvedValue(undefined),
    getAddresses: vi.fn().mockResolvedValue([]),
    addAddress: vi.fn().mockResolvedValue({ id: 'addr_1' }),
    updateAddress: vi.fn().mockResolvedValue({ id: 'addr_1' }),
    deleteAddress: vi.fn().mockResolvedValue(undefined),
  }
}

// ---- createOrchestrator ----

describe('createOrchestrator', () => {
  it('should expose name and universal domains', async () => {
    const catalog = mockCatalog()
    const store = mockStore()
    const orch = createOrchestrator({ name: 'test', catalog, store })

    expect(orch.name).toBe('test')
    expect(orch.capabilities).toContain('catalog')
    expect(orch.capabilities).toContain('store')

    await orch.getProduct({ id: 'prod_1' })
    expect(catalog.getProduct).toHaveBeenCalledWith({ id: 'prod_1' })

    await orch.getStoreInfo()
    expect(store.getStoreInfo).toHaveBeenCalled()
  })

  it('should support available optional domains', () => {
    const cart = mockCart()
    const orch = createOrchestrator({
      name: 'test',
      catalog: mockCatalog(),
      store: mockStore(),
      domains: { cart },
    })

    expect(orch.supports('cart')).toBe(true)
    expect(orch.supports('customers')).toBe(false)
    expect(orch.capabilities).toContain('cart')
    expect(orch.capabilities).not.toContain('customers')
  })

  it('should return domain adapter via domain()', async () => {
    const cart = mockCart()
    const orch = createOrchestrator({
      name: 'test',
      catalog: mockCatalog(),
      store: mockStore(),
      domains: { cart },
    })

    const cartDomain = orch.domain('cart')
    expect(cartDomain).toBe(cart)

    await cartDomain.createCart()
    expect(cart.createCart).toHaveBeenCalled()
  })

  it('should throw NOT_SUPPORTED for missing domains', () => {
    const orch = createOrchestrator({
      name: 'test',
      catalog: mockCatalog(),
      store: mockStore(),
    })

    expect(() => orch.domain('cart')).toThrow(CommerceError)
    expect(() => orch.domain('cart')).toThrow('does not support the "cart" domain')
  })
})

// ---- createCompositeOrchestrator ----

describe('createCompositeOrchestrator', () => {
  it('should route domains to different sources', async () => {
    const shopifyCatalog = mockCatalog()
    const shopifyStore = mockStore()
    const platformCart = mockCart()
    const crmCustomers = mockCustomer()

    const orch = createCompositeOrchestrator({
      name: 'hybrid',
      providers: {
        catalog: shopifyCatalog,
        store: shopifyStore,
        cart: platformCart,
        customers: crmCustomers,
      },
    })

    expect(orch.name).toBe('hybrid')

    // Catalog goes to shopify
    await orch.getProduct({ id: 'prod_1' })
    expect(shopifyCatalog.getProduct).toHaveBeenCalled()

    // Cart goes to platform
    await orch.domain('cart').createCart()
    expect(platformCart.createCart).toHaveBeenCalled()

    // Customers goes to CRM
    await orch.domain('customers').login('a@b.com', 'pass')
    expect(crmCustomers.login).toHaveBeenCalledWith('a@b.com', 'pass')
  })

  it('should report capabilities from all providers', () => {
    const orch = createCompositeOrchestrator({
      name: 'test',
      providers: {
        catalog: mockCatalog(),
        store: mockStore(),
        cart: mockCart(),
      },
    })

    expect(orch.capabilities).toContain('catalog')
    expect(orch.capabilities).toContain('store')
    expect(orch.capabilities).toContain('cart')
    expect(orch.supports('cart')).toBe(true)
    expect(orch.supports('customers')).toBe(false)
  })
})

// ---- withPlatformFallback ----

describe('withPlatformFallback', () => {
  it('should use primary domain when available', async () => {
    const primaryCart = mockCart()
    const fallbackCart = mockCart()

    const primary = createOrchestrator({
      name: 'primary',
      catalog: mockCatalog(),
      store: mockStore(),
      domains: { cart: primaryCart },
    })

    const fallback = createOrchestrator({
      name: 'fallback',
      catalog: mockCatalog(),
      store: mockStore(),
      domains: { cart: fallbackCart },
    })

    const hybrid = withPlatformFallback(primary, fallback)

    await hybrid.domain('cart').createCart()
    expect(primaryCart.createCart).toHaveBeenCalled()
    expect(fallbackCart.createCart).not.toHaveBeenCalled()
  })

  it('should fallback to secondary when primary lacks domain', async () => {
    const fallbackCart = mockCart()

    const primary = createOrchestrator({
      name: 'primary',
      catalog: mockCatalog(),
      store: mockStore(),
      // No cart domain
    })

    const fallback = createOrchestrator({
      name: 'fallback',
      catalog: mockCatalog(),
      store: mockStore(),
      domains: { cart: fallbackCart },
    })

    const hybrid = withPlatformFallback(primary, fallback)

    expect(hybrid.supports('cart')).toBe(true)
    await hybrid.domain('cart').createCart()
    expect(fallbackCart.createCart).toHaveBeenCalled()
  })

  it('should use primary universal domains', async () => {
    const primaryCatalog = mockCatalog()
    const fallbackCatalog = mockCatalog()

    const primary = createOrchestrator({
      name: 'primary',
      catalog: primaryCatalog,
      store: mockStore(),
    })

    const fallback = createOrchestrator({
      name: 'fallback',
      catalog: fallbackCatalog,
      store: mockStore(),
    })

    const hybrid = withPlatformFallback(primary, fallback)

    await hybrid.getProduct({ id: 'prod_1' })
    expect(primaryCatalog.getProduct).toHaveBeenCalled()
    expect(fallbackCatalog.getProduct).not.toHaveBeenCalled()
  })

  it('should name the hybrid orchestrator', () => {
    const primary = createOrchestrator({
      name: 'salla',
      catalog: mockCatalog(),
      store: mockStore(),
    })
    const fallback = createOrchestrator({
      name: 'platform',
      catalog: mockCatalog(),
      store: mockStore(),
    })

    const hybrid = withPlatformFallback(primary, fallback)
    expect(hybrid.name).toBe('salla+fallback')
  })

  it('should throw NOT_SUPPORTED when neither has domain', () => {
    const primary = createOrchestrator({
      name: 'salla',
      catalog: mockCatalog(),
      store: mockStore(),
    })
    const fallback = createOrchestrator({
      name: 'platform',
      catalog: mockCatalog(),
      store: mockStore(),
    })

    const hybrid = withPlatformFallback(primary, fallback)

    expect(hybrid.supports('wholesale')).toBe(false)
    expect(() => hybrid.domain('wholesale')).toThrow(CommerceError)
  })
})
