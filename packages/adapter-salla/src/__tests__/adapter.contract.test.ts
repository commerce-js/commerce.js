// ---------------------------------------------------------------------------
// Adapter contract test — validates SallaAdapter against CommerceAdapter
// ---------------------------------------------------------------------------
// Tests that:
// 1. The adapter implements all required methods
// 2. Supported methods don't throw NOT_SUPPORTED
// 3. Unsupported methods throw CommerceError with NOT_SUPPORTED code
// 4. Capabilities array matches actual behavior

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SallaAdapter } from '../adapter.js'
import { CommerceError } from '@commercejs/types'

// Mock SallaClient to avoid real API calls
// Return minimal but valid Salla-shaped data so mappers don't crash
const mockProduct = {
  id: 1, sku: null, name: 'Mock', description: null, short_description: null,
  slug: 'mock', status: 'sale', type: 'product',
  price: { amount: 10, currency: 'SAR' }, sale_price: null,
  regular_price: { amount: 10, currency: 'SAR' },
  quantity: 1, max_quantity_per_order: null, min_quantity_per_order: null,
  images: [], categories: [], options: [], skus: [], tags: [],
  brand: null, rating: null, weight: null, weight_unit: null,
  require_shipping: true, urls: { customer: '', admin: '' },
  promotion: null, has_options: false, is_available: true,
  created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z',
  metadata: null,
}

const mockOrder = {
  id: 1, reference_id: '1',
  status: { id: 1, name: 'Pending', slug: 'pending', customized: null },
  payment_method: null, currency: 'SAR',
  amounts: {
    total: { amount: 10, currency: 'SAR' },
    sub_total: { amount: 10, currency: 'SAR' },
    shipping_cost: { amount: 0, currency: 'SAR' },
    cash_on_delivery: { amount: 0, currency: 'SAR' },
    tax: { percent: '0', amount: { amount: 0, currency: 'SAR' } },
    discounts: [],
  },
  items: [], customer: null, shipping: null, coupon: null, note: null,
  urls: { customer: '', admin: '' },
  created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z',
  date: { date: '2025-01-01 00:00:00', timezone_type: 3, timezone: 'UTC' },
}

const mockOrderStatus = {
  id: 1, name: 'In Progress', type: 'original' as const, slug: 'in_progress',
  message: null, color: '#3498db', icon: 'fas fa-spinner',
  sort: 3, is_active: true, original: null, parent: null, children: null,
}

const mockOrderHistory = {
  id: 100, action: 'Order created', note: null,
  created_at: '2025-01-01T00:00:00Z',
}

vi.mock('../client.js', () => {
  return {
    SallaClient: class MockSallaClient {
      get = vi.fn().mockImplementation((path: string) => {
        if (path.startsWith('/products/')) return Promise.resolve({ data: mockProduct })
        if (path === '/orders/statuses') return Promise.resolve({ data: [mockOrderStatus] })
        if (path === '/orders/histories') return Promise.resolve({ data: [mockOrderHistory] })
        if (path.startsWith('/orders/')) return Promise.resolve({ data: mockOrder })
        if (path === '/store/info') return Promise.resolve({ data: { name: 'Mock', description: null, logo: null } })
        if (path === '/currencies') return Promise.resolve({ data: [] })
        return Promise.resolve({ data: [] })
      })
      post = vi.fn().mockImplementation((_path: string) => {
        return Promise.resolve({ data: mockOrder })
      })
      put = vi.fn().mockResolvedValue({ data: {} })
      delete = vi.fn().mockResolvedValue({ data: {} })
      paginated = vi.fn().mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        perPage: 10,
        totalPages: 1,
      })
    },
  }
})

describe('SallaAdapter Contract', () => {
  let adapter: SallaAdapter

  beforeEach(() => {
    adapter = new SallaAdapter({
      accessToken: 'test-token',
      locale: 'en',
    })
  })

  describe('identity', () => {
    it('should have name "salla"', () => {
      expect(adapter.name).toBe('salla')
    })

    it('should declare capabilities', () => {
      expect(adapter.capabilities).toBeDefined()
      expect(Array.isArray(adapter.capabilities)).toBe(true)
      expect(adapter.capabilities.length).toBeGreaterThan(0)
    })

    it('should include core domains in capabilities', () => {
      expect(adapter.capabilities).toContain('catalog')
      expect(adapter.capabilities).toContain('store')
      expect(adapter.capabilities).toContain('orders')
    })
  })

  describe('CatalogAdapter methods', () => {
    it('getProduct should be callable', async () => {
      // Should not throw NOT_SUPPORTED
      await expect(
        adapter.getProduct({ id: '123' }),
      ).resolves.toBeDefined()
    })

    it('getProducts should be callable', async () => {
      const result = await adapter.getProducts({ query: 'test' })
      expect(result).toHaveProperty('products')
      expect(result).toHaveProperty('facets')
    })

    it('getCategories should be callable', async () => {
      const result = await adapter.getCategories()
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('OrderAdapter methods', () => {
    it('createOrder should be callable', async () => {
      await expect(
        adapter.createOrder({
          items: [{ productId: '1', quantity: 1, unitPrice: { amount: 100, currency: 'SAR', formatted: '100 SAR' } }],
          shippingAddress: {
            firstName: 'Test',
            lastName: 'User',
            phone: null,
            street: '123 Main St',
            street2: null,
            city: 'Riyadh',
            state: null,
            country: 'SA',
            postalCode: '12345',
            district: null,
            nationalAddress: null,
            additionalNumber: null,
          },
          receiver: { firstName: 'Test', lastName: 'User', email: 'test@test.com' },
        }),
      ).resolves.toBeDefined()
    })

    it('getCustomerOrders should be callable', async () => {
      const result = await adapter.getCustomerOrders()
      expect(result).toHaveProperty('items')
    })

    it('getOrder should be callable', async () => {
      await expect(adapter.getOrder('123')).resolves.toBeDefined()
    })

    it('getOrderStatuses should return array', async () => {
      const result = await adapter.getOrderStatuses()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('slug')
      expect(result[0]).toHaveProperty('color')
      expect(result[0]).toHaveProperty('isActive')
    })

    it('updateOrderStatus should be callable', async () => {
      await expect(
        adapter.updateOrderStatus('123', { status: 'in_progress' }),
      ).resolves.toBeUndefined()
    })

    it('cancelOrder should be callable', async () => {
      await expect(adapter.cancelOrder('123')).resolves.toBeUndefined()
    })

    it('duplicateOrder should return an order', async () => {
      const result = await adapter.duplicateOrder('123')
      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('orderNumber')
    })

    it('getOrderHistory should return array', async () => {
      const result = await adapter.getOrderHistory('123')
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('action')
      expect(result[0]).toHaveProperty('orderId', '123')
    })
  })

  describe('StoreAdapter methods', () => {
    it('getStoreInfo should be callable', async () => {
      // Mock the parallel calls getStoreInfo makes
      await expect(adapter.getStoreInfo()).resolves.toBeDefined()
    })
  })

  describe('NOT_SUPPORTED methods', () => {
    const unsupportedMethods: Array<[string, () => Promise<unknown>]> = [
      ['createCart', () => adapter.createCart()],
      ['getCart', () => adapter.getCart('123')],
      ['addToCart', () => adapter.addToCart('123', { productId: '1', quantity: 1 })],
      ['updateCartItem', () => adapter.updateCartItem('123', '1', 2)],
      ['removeFromCart', () => adapter.removeFromCart('123', '1')],
      ['applyCoupon', () => adapter.applyCoupon('123', 'CODE')],
      ['removeCoupon', () => adapter.removeCoupon('123')],
      ['setShippingAddress', () => adapter.setShippingAddress('123', {} as any)],
      ['setBillingAddress', () => adapter.setBillingAddress('123', {} as any)],
      ['setShippingMethod', () => adapter.setShippingMethod('123', 'method1')],
      ['setPaymentMethod', () => adapter.setPaymentMethod('123', 'method1')],
      ['placeOrder', () => adapter.placeOrder('123')],
      ['login', () => adapter.login('test@test.com', 'pass')],
      ['getWishlist', () => adapter.getWishlist()],
      ['addToWishlist', () => adapter.addToWishlist('123')],
      ['removeFromWishlist', () => adapter.removeFromWishlist('123')],
    ]

    it.each(unsupportedMethods)(
      '%s should throw CommerceError with NOT_SUPPORTED code',
      async (name, method) => {
        await expect(method()).rejects.toThrow(CommerceError)
        try {
          await method()
        } catch (err) {
          expect(err).toBeInstanceOf(CommerceError)
          expect((err as CommerceError).code).toBe('NOT_SUPPORTED')
          expect((err as CommerceError).statusCode).toBe(501)
        }
      },
    )
  })

  describe('capabilities consistency', () => {
    it('should not include "cart" since cart is not supported', () => {
      expect(adapter.capabilities).not.toContain('cart')
    })

    it('should not include "checkout" since full checkout is not supported', () => {
      expect(adapter.capabilities).not.toContain('checkout')
    })

    it('should not include "wishlist" since wishlist is not supported', () => {
      expect(adapter.capabilities).not.toContain('wishlist')
    })
  })
})
