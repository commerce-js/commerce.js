// ---------------------------------------------------------------------------
// Adapter contract test — validates MedusaAdapter against CommerceAdapter
// ---------------------------------------------------------------------------
// Tests that:
// 1. The adapter implements all required methods
// 2. Supported methods don't throw NOT_SUPPORTED
// 3. Unsupported methods throw CommerceError with NOT_SUPPORTED code
// 4. Capabilities array matches actual behavior

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MedusaAdapter } from '../adapter.js'
import { CommerceError } from '@commercejs/types'
import type { MedusaProduct, MedusaCart, MedusaCustomer, MedusaOrder, MedusaRegion, MedusaShippingOption, MedusaProductCategory } from '../types.js'

// ---- Mock data (minimal Medusa-shaped) ----

const mockMedusaProduct: MedusaProduct = {
  id: 'prod_01',
  title: 'Test Product',
  subtitle: null,
  description: 'A test product',
  handle: 'test-product',
  is_giftcard: false,
  status: 'published',
  thumbnail: 'https://example.com/thumb.jpg',
  images: [{ id: 'img_01', url: 'https://example.com/image.jpg' }],
  options: [{ id: 'opt_01', title: 'Size', product_id: 'prod_01', values: [{ id: 'val_01', value: 'M', option_id: 'opt_01' }] }],
  variants: [{
    id: 'var_01',
    title: 'M',
    sku: 'TST-M',
    barcode: null,
    ean: null,
    upc: null,
    manage_inventory: true,
    allow_backorder: false,
    inventory_quantity: 10,
    calculated_price: { calculated_amount: 2999, original_amount: 2999, currency_code: 'usd' },
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  }],
  tags: [{ id: 'tag_01', value: 'test' }],
  categories: [],
  collection_id: null,
  type_id: null,
  weight: null,
  length: null,
  height: null,
  width: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

const mockMedusaCategory: MedusaProductCategory = {
  id: 'pcat_01',
  name: 'Clothing',
  description: 'All clothing',
  handle: 'clothing',
  is_active: true,
  is_internal: false,
  rank: 0,
  parent_category_id: null,
  category_children: [],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

const mockMedusaCart: MedusaCart = {
  id: 'cart_01',
  region_id: 'reg_01',
  customer_id: null,
  email: null,
  currency_code: 'usd',
  items: [{
    id: 'item_01',
    cart_id: 'cart_01',
    title: 'Test Product - M',
    description: null,
    thumbnail: 'https://example.com/thumb.jpg',
    quantity: 1,
    variant_id: 'var_01',
    product_id: 'prod_01',
    unit_price: 2999,
    total: 2999,
    subtotal: 2999,
    discount_total: 0,
    tax_total: 0,
    original_total: 2999,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  }],
  subtotal: 2999,
  shipping_total: 0,
  tax_total: 0,
  discount_total: 0,
  total: 2999,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

const mockMedusaCustomer: MedusaCustomer = {
  id: 'cus_01',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  phone: '+1234567890',
  has_account: true,
  addresses: [],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

const mockMedusaOrder: MedusaOrder = {
  id: 'order_01',
  display_id: 1001,
  status: 'pending',
  fulfillment_status: 'not_fulfilled',
  payment_status: 'captured',
  customer_id: 'cus_01',
  email: 'test@example.com',
  currency_code: 'usd',
  items: [{
    id: 'oitem_01',
    order_id: 'order_01',
    title: 'Test Product - M',
    description: null,
    thumbnail: null,
    variant_id: 'var_01',
    product_id: 'prod_01',
    quantity: 1,
    unit_price: 2999,
    subtotal: 2999,
    total: 2999,
    tax_total: 0,
    discount_total: 0,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  }],
  subtotal: 2999,
  shipping_total: 0,
  tax_total: 0,
  discount_total: 0,
  total: 2999,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

const mockMedusaRegion: MedusaRegion = {
  id: 'reg_01',
  name: 'North America',
  currency_code: 'usd',
  countries: [{ iso_2: 'US', iso_3: 'USA', name: 'United States', display_name: 'United States', num_code: 840 }],
  tax_rate: 0,
  automatic_taxes: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

const mockShippingOption: MedusaShippingOption = {
  id: 'so_01',
  name: 'Standard Shipping',
  amount: 500,
  is_return: false,
  provider_id: 'manual',
}

// ---- Mock the client ----

vi.mock('../client.js', () => {
  return {
    MedusaClient: class MockMedusaClient {
      setToken = vi.fn()
      clearToken = vi.fn()

      get = vi.fn().mockImplementation((path: string) => {
        if (path.match(/^\/products\/[^/]+$/)) return Promise.resolve({ product: mockMedusaProduct })
        if (path === '/products') return Promise.resolve({ products: [mockMedusaProduct], count: 1 })
        if (path === '/product-categories') return Promise.resolve({ product_categories: [mockMedusaCategory] })
        if (path.match(/^\/carts\/[^/]+$/)) return Promise.resolve({ cart: mockMedusaCart })
        if (path === '/shipping-options') return Promise.resolve({ shipping_options: [mockShippingOption] })
        if (path === '/customers/me') return Promise.resolve({ customer: mockMedusaCustomer })
        if (path.match(/^\/orders\/[^/]+$/)) return Promise.resolve({ order: mockMedusaOrder })
        if (path === '/regions') return Promise.resolve({ regions: [mockMedusaRegion] })
        return Promise.resolve({})
      })

      post = vi.fn().mockImplementation((path: string) => {
        if (path === '/carts') return Promise.resolve({ cart: mockMedusaCart })
        if (path.match(/\/carts\/.*\/line-items/)) return Promise.resolve({ cart: mockMedusaCart })
        if (path.match(/\/carts\/.*\/shipping-methods/)) return Promise.resolve({ cart: mockMedusaCart })
        if (path.match(/\/carts\/.*\/payment-sessions/)) return Promise.resolve({ cart: mockMedusaCart })
        if (path.match(/\/carts\/.*\/promotions/)) return Promise.resolve({ cart: mockMedusaCart })
        if (path.match(/\/carts\/.*\/complete/)) return Promise.resolve({ order: mockMedusaOrder })
        if (path.match(/\/carts\/.*/)) return Promise.resolve({ cart: mockMedusaCart })
        if (path === '/customers') return Promise.resolve({ customer: mockMedusaCustomer })
        if (path === '/customers/me') return Promise.resolve({ customer: mockMedusaCustomer })
        return Promise.resolve({})
      })

      del = vi.fn().mockImplementation((path: string) => {
        if (path.match(/\/carts\/.*\/line-items/)) return Promise.resolve({ cart: mockMedusaCart })
        return Promise.resolve({})
      })

      authPost = vi.fn().mockImplementation(() => {
        return Promise.resolve({ token: 'mock-jwt-token' })
      })

      authDelete = vi.fn().mockResolvedValue({})

      paginated = vi.fn().mockResolvedValue({
        data: [mockMedusaOrder],
        total: 1,
        page: 1,
        perPage: 20,
      })
    },
  }
})

// ---- Tests ----

describe('MedusaAdapter Contract', () => {
  let adapter: MedusaAdapter

  beforeEach(() => {
    adapter = new MedusaAdapter({
      baseUrl: 'http://localhost:9000',
      publishableApiKey: 'pk_test_123',
      defaultRegionId: 'reg_01',
    })
  })

  describe('identity', () => {
    it('should have name "medusa"', () => {
      expect(adapter.name).toBe('medusa')
    })

    it('should declare capabilities', () => {
      expect(adapter.capabilities).toBeDefined()
      expect(Array.isArray(adapter.capabilities)).toBe(true)
      expect(adapter.capabilities.length).toBeGreaterThan(0)
    })

    it('should include supported domains in capabilities', () => {
      expect(adapter.capabilities).toContain('catalog')
      expect(adapter.capabilities).toContain('cart')
      expect(adapter.capabilities).toContain('checkout')
      expect(adapter.capabilities).toContain('customers')
      expect(adapter.capabilities).toContain('orders')
      expect(adapter.capabilities).toContain('store')
      expect(adapter.capabilities).toContain('countries')
    })

    it('should not include unsupported domains', () => {
      expect(adapter.capabilities).not.toContain('wishlist')
      expect(adapter.capabilities).not.toContain('reviews')
      expect(adapter.capabilities).not.toContain('promotions')
      expect(adapter.capabilities).not.toContain('brands')
      expect(adapter.capabilities).not.toContain('locations')
    })
  })

  describe('CatalogAdapter methods', () => {
    it('getProduct by id should return a product', async () => {
      const product = await adapter.getProduct({ id: 'prod_01' })
      expect(product).toBeDefined()
      expect(product.id).toBe('prod_01')
      expect(product.name.en).toBe('Test Product')
      expect(product.slug).toBe('test-product')
    })

    it('getProduct by slug should return a product', async () => {
      const product = await adapter.getProduct({ slug: 'test-product' })
      expect(product).toBeDefined()
      expect(product.slug).toBe('test-product')
    })

    it('getProducts should return search results', async () => {
      const result = await adapter.getProducts({ query: 'test' })
      expect(result).toHaveProperty('products')
      expect(result).toHaveProperty('facets')
      expect(result.products.items.length).toBeGreaterThanOrEqual(0)
    })

    it('getCategories should return categories', async () => {
      const result = await adapter.getCategories()
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('CartAdapter methods', () => {
    it('createCart should return a cart', async () => {
      const cart = await adapter.createCart()
      expect(cart).toBeDefined()
      expect(cart.id).toBe('cart_01')
    })

    it('getCart should return a cart', async () => {
      const cart = await adapter.getCart('cart_01')
      expect(cart).toBeDefined()
      expect(cart.id).toBe('cart_01')
      expect(cart.items.length).toBeGreaterThan(0)
    })

    it('addToCart should require variantId', async () => {
      await expect(
        adapter.addToCart('cart_01', { productId: 'prod_01', quantity: 1 }),
      ).rejects.toThrow(CommerceError)
    })

    it('addToCart should succeed with variantId', async () => {
      const cart = await adapter.addToCart('cart_01', {
        productId: 'prod_01',
        variantId: 'var_01',
        quantity: 1,
      })
      expect(cart).toBeDefined()
      expect(cart.id).toBe('cart_01')
    })

    it('updateCartItem should be callable', async () => {
      const cart = await adapter.updateCartItem('cart_01', 'item_01', 2)
      expect(cart).toBeDefined()
    })

    it('removeFromCart should be callable', async () => {
      const cart = await adapter.removeFromCart('cart_01', 'item_01')
      expect(cart).toBeDefined()
    })
  })

  describe('CheckoutAdapter methods', () => {
    it('getShippingMethods should return methods', async () => {
      const methods = await adapter.getShippingMethods('cart_01')
      expect(Array.isArray(methods)).toBe(true)
    })

    it('setShippingAddress should return updated cart', async () => {
      const cart = await adapter.setShippingAddress('cart_01', {
        firstName: 'Test',
        lastName: 'User',
        phone: null,
        street: '123 Main St',
        street2: null,
        city: 'New York',
        state: 'NY',
        country: 'US',
        postalCode: '10001',
        district: null,
        nationalAddress: null,
        additionalNumber: null,
      })
      expect(cart).toBeDefined()
    })

    it('setShippingMethod should be callable', async () => {
      const cart = await adapter.setShippingMethod('cart_01', 'so_01')
      expect(cart).toBeDefined()
    })

    it('placeOrder should return an order', async () => {
      const order = await adapter.placeOrder('cart_01')
      expect(order).toBeDefined()
      expect(order.orderNumber).toBe('#1001')
    })
  })

  describe('CustomerAdapter methods', () => {
    it('login should return customer', async () => {
      const customer = await adapter.login('test@example.com', 'password123')
      expect(customer).toBeDefined()
      expect(customer.email).toBe('test@example.com')
    })

    it('register should return customer', async () => {
      const customer = await adapter.register({
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      })
      expect(customer).toBeDefined()
    })

    it('getCustomer should return customer', async () => {
      const customer = await adapter.getCustomer()
      expect(customer).toBeDefined()
      expect(customer.id).toBe('cus_01')
    })
  })

  describe('OrderAdapter methods', () => {
    it('getOrder should return an order', async () => {
      const order = await adapter.getOrder('order_01')
      expect(order).toBeDefined()
      expect(order.id).toBe('order_01')
      expect(order.status).toBe('pending')
    })

    it('getCustomerOrders should return paginated results', async () => {
      const result = await adapter.getCustomerOrders()
      expect(result).toHaveProperty('items')
      expect(result).toHaveProperty('total')
    })

    it('createOrder should throw NOT_SUPPORTED (admin-only operation)', async () => {
      await expect(
        adapter.createOrder({
          items: [],
          shippingAddress: {
            firstName: 'Test', lastName: 'User',
            phone: null, street: '123', street2: null,
            city: 'NYC', state: null, country: 'US',
            postalCode: '10001', district: null,
            nationalAddress: null, additionalNumber: null,
          },
          receiver: { firstName: 'Test', lastName: 'User', email: 'test@test.com' },
        }),
      ).rejects.toThrow(CommerceError)
    })
  })

  describe('StoreAdapter methods', () => {
    it('getStoreInfo should return store info', async () => {
      const info = await adapter.getStoreInfo()
      expect(info).toBeDefined()
      expect(info.name.en).toBeDefined()
      expect(info.currencies.length).toBeGreaterThan(0)
    })
  })

  describe('CountryAdapter methods', () => {
    it('getCountries should return countries', async () => {
      const countries = await adapter.getCountries()
      expect(Array.isArray(countries)).toBe(true)
      expect(countries.length).toBeGreaterThan(0)
      expect(countries[0].code).toBe('US')
    })
  })

  describe('NOT_SUPPORTED methods', () => {
    const unsupportedMethods: Array<[string, () => Promise<unknown>]> = [
      ['getWishlist', () => adapter.getWishlist()],
      ['addToWishlist', () => adapter.addToWishlist('123')],
      ['removeFromWishlist', () => adapter.removeFromWishlist('123')],
      ['getProductReviews', () => adapter.getProductReviews('123')],
      ['getReviewSummary', () => adapter.getReviewSummary('123')],
      ['submitReview', () => adapter.submitReview({} as any)],
      ['getActivePromotions', () => adapter.getActivePromotions()],
      ['validateCoupon', () => adapter.validateCoupon('CODE')],
      ['createReturn', () => adapter.createReturn({} as any)],
      ['getReturns', () => adapter.getReturns()],
      ['getReturn', () => adapter.getReturn('123')],
      ['cancelReturn', () => adapter.cancelReturn('123')],
      ['getBrands', () => adapter.getBrands()],
      ['getStoreLocations', () => adapter.getStoreLocations()],
      ['getCustomerGroups', () => adapter.getCustomerGroups()],
      ['createQuote', () => adapter.createQuote({} as any)],
      ['placeBid', () => adapter.placeBid({} as any)],
      ['purchaseGiftCard', () => adapter.purchaseGiftCard({} as any)],
    ]

    it.each(unsupportedMethods)(
      '%s should throw CommerceError with NOT_SUPPORTED code',
      async (_name, method) => {
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
})
