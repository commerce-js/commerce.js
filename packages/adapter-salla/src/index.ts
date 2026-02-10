// Adapter
export { SallaAdapter } from './adapter.js'

// Client (for advanced usage / custom requests)
export { SallaClient } from './client.js'

// Config type
export type { SallaConfig } from './types.js'

// Salla raw types (for custom mappers)
export type {
  SallaApiResponse,
  SallaRawProduct,
  SallaRawCategory,
  SallaRawCustomer,
  SallaRawOrder,
  SallaRawOrderItem,
  SallaRawOrderStatus,
  SallaRawOrderHistory,
  SallaRawReview,
  SallaRawShippingCompany,
  SallaRawPaymentMethod,
  SallaRawCoupon,
  SallaRawStoreInfo,
  SallaRawCurrency,
  SallaRawImage,
  SallaRawOption,
  SallaRawSku,
  SallaRawAddress,
  SallaRawBrand,
  SallaRawCountry,
  SallaRawBranch,
} from './types.js'

// Mappers (for custom transformations)
export {
  mapSallaProduct,
  mapSallaCategory,
  mapSallaCustomer,
  mapSallaAddress,
  mapSallaOrder,
  mapSallaOrderStatus,
  mapSallaOrderHistory,
  mapSallaReview,
  mapSallaShipping,
  mapSallaPayment,
  mapSallaBrand,
  mapSallaCountry,
  mapSallaBranch,
} from './mappers/index.js'
