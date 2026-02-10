// ---------------------------------------------------------------------------
// Mapper unit tests — Salla raw data → unified domain types
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest'
import { mapSallaProduct } from '../mappers/product.js'
import { mapSallaCategory } from '../mappers/category.js'
import { mapSallaCustomer, mapSallaAddress } from '../mappers/customer.js'
import { mapSallaOrder } from '../mappers/order.js'
import { mapSallaReview } from '../mappers/review.js'
import { mapSallaBrand } from '../mappers/brand.js'
import { mapSallaCountry } from '../mappers/country.js'
import { mapSallaBranch } from '../mappers/location.js'
import { mapSallaOrderStatus, mapSallaOrderHistory } from '../mappers/order-status.js'
import type {
  SallaRawProduct,
  SallaRawCategory,
  SallaRawCustomer,
  SallaRawOrder,
  SallaRawAddress,
  SallaRawReview,
  SallaRawBrand,
  SallaRawCountry,
  SallaRawBranch,
  SallaRawOrderStatus,
  SallaRawOrderHistory,
} from '../types.js'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const rawProduct: SallaRawProduct = {
  id: 100,
  sku: 'SKU-100',
  name: 'Test Product',
  description: '<p>Product description</p>',
  short_description: 'Short desc',
  slug: 'test-product',
  status: 'sale',
  type: 'product',
  price: { amount: 99.99, currency: 'SAR' },
  sale_price: { amount: 79.99, currency: 'SAR' },
  regular_price: { amount: 99.99, currency: 'SAR' },
  quantity: 50,
  max_quantity_per_order: 10,
  min_quantity_per_order: 1,
  images: [{ id: 1, url: 'https://cdn.salla.sa/img1.jpg', alt: 'Main', sort: 0, main: true, type: 'image', three_d_image_url: null, video_url: null }],
  categories: [{ id: 10, name: 'الملابس', slug: 'clothing' }],
  options: [],
  skus: [],
  tags: [{ name: 'new' }],
  brand: { id: 5, name: 'Nike', slug: 'nike' },
  rating: { count: 12, average: 4.5 },
  weight: 0.5,
  weight_unit: 'kg',
  require_shipping: true,
  urls: { customer: 'https://store.test/p/test-product', admin: 'https://s.salla.sa/admin/products/100' },
  promotion: null,
  has_options: false,
  is_available: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-06-01T00:00:00Z',
  metadata: null,
}

const rawCategory: SallaRawCategory = {
  id: 10,
  name: 'الملابس',
  slug: 'clothing',
  description: 'Category description',
  image: null,
  parent_id: null,
  sort_order: 1,
  status: 'active',
  urls: { customer: 'https://store.test/c/clothing', admin: 'https://s.salla.sa/admin/categories/10' },
  products_count: 25,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-06-01T00:00:00Z',
}

const rawCustomer: SallaRawCustomer = {
  id: 200,
  first_name: 'أحمد',
  last_name: 'محمد',
  email: 'ahmed@test.com',
  mobile: '501234567',
  mobile_code: '+966',
  avatar: null,
  gender: null,
  birthday: null,
  city: 'Riyadh',
  country: 'SA',
  currency: 'SAR',
  urls: { customer: '', admin: '' },
  created_at: '2025-03-15T10:00:00Z',
  updated_at: '2025-06-01T10:00:00Z',
}

const rawAddress: SallaRawAddress = {
  id: 50,
  city: 'Riyadh',
  country: 'Saudi Arabia',
  country_code: 'SA',
  street_number: '123 King Fahd Rd',
  block: 'Al Olaya',
  postal_code: '12345',
  lat: '24.7136',
  lng: '46.6753',
}

const rawOrder: SallaRawOrder = {
  id: 300,
  reference_id: 'ORD-300',
  status: { id: 1, name: 'Under Review', slug: 'under_review', customized: null },
  payment_method: 'credit_card',
  currency: 'SAR',
  amounts: {
    total: { amount: 120, currency: 'SAR' },
    sub_total: { amount: 100, currency: 'SAR' },
    shipping_cost: { amount: 15, currency: 'SAR' },
    cash_on_delivery: { amount: 0, currency: 'SAR' },
    tax: { percent: '15%', amount: { amount: 15, currency: 'SAR' } },
    discounts: [{ amount: 10, currency: 'SAR' }],
  },
  items: [
    {
      id: 1,
      product_id: 100,
      sku: 'SKU-100',
      name: 'Test Product',
      quantity: 2,
      price: { amount: 50, currency: 'SAR' },
      total: { amount: 100, currency: 'SAR' },
    },
  ],
  customer: rawCustomer,
  shipping: {
    company: 'Aramex',
    receiver: { name: 'أحمد محمد', phone: '+966501234567' },
    address: rawAddress,
    shipment: { tracking_link: 'https://track.test/123', tracking_number: 'TRK123' },
  },
  coupon: { code: 'SAVE10', discount: 10 },
  note: 'Please leave at door',
  urls: { customer: '', admin: '' },
  created_at: '2025-06-01T10:00:00Z',
  updated_at: '2025-06-01T12:00:00Z',
  date: { date: '2025-06-01 10:00:00', timezone_type: 3, timezone: 'Asia/Riyadh' },
}

const rawReview: SallaRawReview = {
  id: 400,
  content: 'Great product!',
  rating: 5,
  customer: { id: 200, name: 'أحمد', avatar: null },
  product_id: 100,
  status: 'published',
  created_at: '2025-06-15T08:00:00Z',
  updated_at: '2025-06-15T08:00:00Z',
}

const rawBrand: SallaRawBrand = {
  id: 5,
  name: 'Nike',
  description: 'Just Do It',
  logo: 'https://cdn.salla.sa/nike.png',
  slug: 'nike',
  status: 'active',
}

const rawCountry: SallaRawCountry = {
  id: 1,
  name: 'المملكة العربية السعودية',
  name_en: 'Saudi Arabia',
  code: 'SA',
  mobile_code: '+966',
  capital: 'Riyadh',
}

const rawBranch: SallaRawBranch = {
  id: 1,
  name: 'فرع الرياض',
  status: 'active',
  is_default: true,
  location: { lat: '24.7136', lng: '46.6753' },
  short_address: 'Riyadh, Saudi Arabia',
  street: 'King Fahd Road',
  address_description: 'Near Al Faisaliah Tower',
  postal_code: '12345',
  contacts: { phone: '+966112345678', whatsapp: null, telephone: null },
  working_hours: [
    { day: 'Sunday', from: '09:00', to: '21:00' },
  ],
  is_open: true,
  is_cod_available: true,
  pickable: true,
  shippable: true,
  country: { id: 1, name: 'السعودية', name_en: 'Saudi Arabia', code: 'SA' },
  city: { id: 1, name: 'الرياض', name_en: 'Riyadh' },
  region: { id: 1, name: 'منطقة الرياض', code: 'RUH' },
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('mapSallaProduct', () => {
  it('maps id and slug correctly', () => {
    const product = mapSallaProduct(rawProduct, 'en')
    expect(product.id).toBe('100')
    expect(product.slug).toBe('test-product')
    expect(product.sku).toBe('SKU-100')
  })

  it('maps bilingual name', () => {
    const productAr = mapSallaProduct(rawProduct, 'ar')
    expect(productAr.name.ar).toBe('Test Product')

    const productEn = mapSallaProduct(rawProduct, 'en')
    expect(productEn.name.en).toBe('Test Product')
  })

  it('maps price and sale price', () => {
    const product = mapSallaProduct(rawProduct, 'en')
    expect(product.price!.amount).toBe(99.99)
    expect(product.price!.currency).toBe('SAR')
  })

  it('maps gallery', () => {
    const product = mapSallaProduct(rawProduct, 'en')
    expect(product.gallery.length).toBe(1)
    expect(product.gallery[0].url).toBe('https://cdn.salla.sa/img1.jpg')
  })

  it('maps availability', () => {
    const product = mapSallaProduct(rawProduct, 'en')
    expect(product.inStock).toBe(true)
  })

  it('maps categories', () => {
    const product = mapSallaProduct(rawProduct, 'en')
    expect(product.categories.length).toBe(1)
    expect(product.categories[0].id).toBe('10')
  })
})

describe('mapSallaCategory', () => {
  it('maps id and slug', () => {
    const cat = mapSallaCategory(rawCategory, 'en')
    expect(cat.id).toBe('10')
    expect(cat.slug).toBe('clothing')
  })

  it('maps localized name', () => {
    const cat = mapSallaCategory(rawCategory, 'ar')
    expect(cat.name.ar).toBe('الملابس')
  })

  it('maps parent_id as null when no parent', () => {
    const cat = mapSallaCategory(rawCategory, 'en')
    expect(cat.parentId).toBeNull()
  })
})

describe('mapSallaCustomer', () => {
  it('maps id and email', () => {
    const customer = mapSallaCustomer(rawCustomer)
    expect(customer.id).toBe('200')
    expect(customer.email).toBe('ahmed@test.com')
  })

  it('maps name fields', () => {
    const customer = mapSallaCustomer(rawCustomer)
    expect(customer.firstName).toBe('أحمد')
    expect(customer.lastName).toBe('محمد')
  })

  it('maps phone with mobile code', () => {
    const customer = mapSallaCustomer(rawCustomer)
    expect(customer.phone).toBe('+966501234567')
  })

  it('handles object date format', () => {
    const customerWithObjDate: SallaRawCustomer = {
      ...rawCustomer,
      created_at: { date: '2025-03-15 10:00:00', timezone_type: 3, timezone: 'Asia/Riyadh' },
    }
    const customer = mapSallaCustomer(customerWithObjDate)
    expect(customer.createdAt).toBe('2025-03-15 10:00:00')
  })
})

describe('mapSallaAddress', () => {
  it('maps id', () => {
    const addr = mapSallaAddress(rawAddress)
    expect(addr.id).toBe('50')
  })

  it('maps city and country code', () => {
    const addr = mapSallaAddress(rawAddress)
    expect(addr.city).toBe('Riyadh')
    expect(addr.country).toBe('SA')
  })

  it('maps street from street_number and block', () => {
    const addr = mapSallaAddress(rawAddress)
    expect(addr.street).toContain('123 King Fahd Rd')
    expect(addr.street).toContain('Al Olaya')
  })

  it('maps postal code', () => {
    const addr = mapSallaAddress(rawAddress)
    expect(addr.postalCode).toBe('12345')
  })

  it('handles null fields gracefully', () => {
    const sparse: SallaRawAddress = {
      id: 99, city: null, country: null, country_code: null,
      street_number: null, block: null, postal_code: null, lat: null, lng: null,
    }
    const addr = mapSallaAddress(sparse)
    expect(addr.city).toBe('')
    expect(addr.country).toBe('')
    expect(addr.postalCode).toBeNull()
  })
})

describe('mapSallaOrder', () => {
  it('maps id and order number', () => {
    const order = mapSallaOrder(rawOrder, 'en')
    expect(order.id).toBe('300')
    expect(order.orderNumber).toBe('ORD-300')
  })

  it('maps status correctly', () => {
    const order = mapSallaOrder(rawOrder, 'en')
    expect(order.status).toBe('processing') // under_review → processing
  })

  it('maps order items', () => {
    const order = mapSallaOrder(rawOrder, 'en')
    expect(order.items.length).toBe(1)
    expect(order.items[0].productId).toBe('100')
    expect(order.items[0].quantity).toBe(2)
  })

  it('maps totals correctly', () => {
    const order = mapSallaOrder(rawOrder, 'en')
    expect(order.totals.subtotal.amount).toBe(100)
    expect(order.totals.shipping!.amount).toBe(15)
    expect(order.totals.tax!.amount).toBe(15)
    expect(order.totals.discount!.amount).toBe(10)
    expect(order.totals.total.amount).toBe(120)
  })

  it('maps shipping info', () => {
    const order = mapSallaOrder(rawOrder, 'en')
    expect(order.trackingNumber).toBe('TRK123')
    expect(order.trackingUrl).toBe('https://track.test/123')
    expect(order.shippingMethod).not.toBeNull()
  })

  it('maps payment method', () => {
    const order = mapSallaOrder(rawOrder, 'en')
    expect(order.paymentMethod).not.toBeNull()
    expect(order.paymentMethod?.provider).toBe('credit_card')
  })

  it('maps customer ID', () => {
    const order = mapSallaOrder(rawOrder, 'en')
    expect(order.customerId).toBe('200')
  })

  it('maps note', () => {
    const order = mapSallaOrder(rawOrder, 'en')
    expect(order.note).toBe('Please leave at door')
  })

  it('handles various status slugs', () => {
    const statuses: Array<[string, string]> = [
      ['under_review', 'processing'],
      ['in_progress', 'processing'],
      ['completed', 'delivered'],
      ['delivered', 'delivered'],
      ['shipped', 'shipped'],
      ['in_transit', 'shipped'],
      ['cancelled', 'cancelled'],
      ['refunded', 'refunded'],
      ['restoring', 'returned'],
      ['restored', 'returned'],
      ['new', 'pending'],
    ]

    for (const [slug, expected] of statuses) {
      const order = mapSallaOrder({
        ...rawOrder,
        status: { ...rawOrder.status, slug },
      }, 'en')
      expect(order.status).toBe(expected)
    }
  })
})

describe('mapSallaReview', () => {
  it('maps id and rating', () => {
    const review = mapSallaReview(rawReview)
    expect(review.id).toBe('400')
    expect(review.rating).toBe(5)
  })

  it('maps content as body', () => {
    const review = mapSallaReview(rawReview)
    expect(review.body).toBe('Great product!')
  })

  it('maps product ID', () => {
    const review = mapSallaReview(rawReview)
    expect(review.productId).toBe('100')
  })
})

describe('mapSallaBrand', () => {
  it('maps id and name', () => {
    const brand = mapSallaBrand(rawBrand, 'en')
    expect(brand.id).toBe('5')
    expect(brand.name.en).toBe('Nike')
  })

  it('maps logo', () => {
    const brand = mapSallaBrand(rawBrand, 'en')
    expect(brand.logo?.url).toBe('https://cdn.salla.sa/nike.png')
  })
})

describe('mapSallaCountry', () => {
  it('maps code', () => {
    const country = mapSallaCountry(rawCountry)
    expect(country.code).toBe('SA')
  })

  it('maps bilingual name', () => {
    const country = mapSallaCountry(rawCountry)
    expect(country.name.ar).toBe('المملكة العربية السعودية')
    expect(country.name.en).toBe('Saudi Arabia')
  })
})

describe('mapSallaBranch', () => {
  it('maps id and name', () => {
    const location = mapSallaBranch(rawBranch, 'ar')
    expect(location.id).toBe('1')
  })

  it('maps coordinates', () => {
    const location = mapSallaBranch(rawBranch, 'ar')
    expect(location.coordinates?.lat).toBe(24.7136)
    expect(location.coordinates?.lng).toBe(46.6753)
  })
})

// ---------------------------------------------------------------------------
// Order Status & History mappers
// ---------------------------------------------------------------------------

const rawOrderStatus: SallaRawOrderStatus = {
  id: 5,
  name: 'In Progress',
  type: 'original',
  slug: 'in_progress',
  message: 'Your order is being prepared',
  color: '#3498db',
  icon: 'fas fa-spinner',
  sort: 3,
  is_active: true,
  original: null,
  parent: null,
  children: [
    {
      id: 50,
      name: '40 minutes left',
      type: 'custom',
      slug: 'custom_40_min',
      message: null,
      color: '#e67e22',
      icon: null,
      sort: 1,
      is_active: true,
      original: { id: 5, name: 'In Progress' },
      parent: { id: 5, name: 'In Progress' },
      children: null,
    },
  ],
}

const rawOrderHistory: SallaRawOrderHistory = {
  id: 100,
  action: 'Order created',
  note: 'Auto-generated',
  created_at: '2025-06-01T10:00:00Z',
}

describe('mapSallaOrderStatus', () => {
  it('maps id and slug', () => {
    const status = mapSallaOrderStatus(rawOrderStatus)
    expect(status.id).toBe('5')
    expect(status.slug).toBe('in_progress')
  })

  it('maps name and type', () => {
    const status = mapSallaOrderStatus(rawOrderStatus)
    expect(status.name).toBe('In Progress')
    expect(status.type).toBe('original')
  })

  it('maps color and icon', () => {
    const status = mapSallaOrderStatus(rawOrderStatus)
    expect(status.color).toBe('#3498db')
    expect(status.icon).toBe('fas fa-spinner')
  })

  it('maps isActive from is_active', () => {
    const status = mapSallaOrderStatus(rawOrderStatus)
    expect(status.isActive).toBe(true)
  })

  it('maps parent as null for top-level', () => {
    const status = mapSallaOrderStatus(rawOrderStatus)
    expect(status.parent).toBeNull()
  })

  it('recursively maps children', () => {
    const status = mapSallaOrderStatus(rawOrderStatus)
    expect(status.children.length).toBe(1)
    expect(status.children[0].id).toBe('50')
    expect(status.children[0].slug).toBe('custom_40_min')
    expect(status.children[0].type).toBe('custom')
    expect(status.children[0].parent).toEqual({ id: '5', name: 'In Progress' })
  })

  it('handles null children as empty array', () => {
    const noChildren: SallaRawOrderStatus = { ...rawOrderStatus, children: null }
    const status = mapSallaOrderStatus(noChildren)
    expect(status.children).toEqual([])
  })

  it('handles null color and icon', () => {
    const plain: SallaRawOrderStatus = { ...rawOrderStatus, color: null, icon: null }
    const status = mapSallaOrderStatus(plain)
    expect(status.color).toBeNull()
    expect(status.icon).toBeNull()
  })
})

describe('mapSallaOrderHistory', () => {
  it('maps id and orderId', () => {
    const entry = mapSallaOrderHistory(rawOrderHistory, '300')
    expect(entry.id).toBe('100')
    expect(entry.orderId).toBe('300')
  })

  it('maps action', () => {
    const entry = mapSallaOrderHistory(rawOrderHistory, '300')
    expect(entry.action).toBe('Order created')
  })

  it('maps note', () => {
    const entry = mapSallaOrderHistory(rawOrderHistory, '300')
    expect(entry.note).toBe('Auto-generated')
  })

  it('maps createdAt from ISO string', () => {
    const entry = mapSallaOrderHistory(rawOrderHistory, '300')
    expect(entry.createdAt).toBe('2025-06-01T10:00:00Z')
  })

  it('maps createdAt from Salla date object', () => {
    const objDate: SallaRawOrderHistory = {
      ...rawOrderHistory,
      created_at: { date: '2025-06-01 10:00:00', timezone_type: 3, timezone: 'Asia/Riyadh' },
    }
    const entry = mapSallaOrderHistory(objDate, '300')
    expect(entry.createdAt).toBe('2025-06-01 10:00:00')
  })

  it('handles null note', () => {
    const noNote: SallaRawOrderHistory = { ...rawOrderHistory, note: null }
    const entry = mapSallaOrderHistory(noNote, '300')
    expect(entry.note).toBeNull()
  })
})
