// ---------------------------------------------------------------------------
// Zod validation schemas for all mutation endpoints
// ---------------------------------------------------------------------------

import { z } from 'zod'

// ---- Auth ----

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

// ---- Cart ----

export const addToCartSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().optional(),
  quantity: z.number().int().positive('Quantity must be at least 1').default(1),
  metadata: z.record(z.unknown()).optional(),
})

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive('Quantity must be at least 1'),
})

// ---- Checkout ----

const addressSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
  phone: z.string().optional(),
})

export const setShippingAddressSchema = z.object({
  cartId: z.string().min(1, 'Cart ID is required'),
  address: addressSchema,
})

export const setBillingAddressSchema = z.object({
  cartId: z.string().min(1, 'Cart ID is required'),
  address: addressSchema,
})

export const setShippingMethodSchema = z.object({
  cartId: z.string().min(1, 'Cart ID is required'),
  methodId: z.string().min(1, 'Method ID is required'),
})

export const setPaymentMethodSchema = z.object({
  cartId: z.string().min(1, 'Cart ID is required'),
  methodId: z.string().min(1, 'Method ID is required'),
})

export const placeOrderSchema = z.object({
  cartId: z.string().min(1, 'Cart ID is required'),
})

// ---- Customer ----

export const updateCustomerSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
})

export const addAddressSchema = addressSchema

export const updateAddressSchema = addressSchema.partial()

// ---- Promotions ----

export const validateCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required'),
})

// ---- Reviews ----

export const submitReviewSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  rating: z.number().int().min(1).max(5),
  title: z.string().optional(),
  body: z.string().min(1, 'Review body is required'),
})

// ---- Returns ----

export const createReturnSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  reason: z.string().min(1, 'Reason is required'),
  items: z.array(z.object({
    orderItemId: z.string().min(1),
    quantity: z.number().int().positive(),
  })).min(1, 'At least one item is required'),
})

// ---- Wishlist ----

export const addToWishlistSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().optional(),
})
