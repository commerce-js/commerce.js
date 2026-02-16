// ---------------------------------------------------------------------------
// @commercejs/adapter-medusa — barrel export
// ---------------------------------------------------------------------------

// Adapter (main export)
export { MedusaAdapter } from './adapter.js'

// Client (for advanced / direct usage)
export { MedusaClient } from './client.js'

// Types (raw Medusa API shapes + config)
export type {
  MedusaConfig,
  MedusaProduct,
  MedusaProductVariant,
  MedusaProductOption,
  MedusaProductOptionValue,
  MedusaProductImage,
  MedusaProductTag,
  MedusaProductCategory,
  MedusaCart,
  MedusaLineItem,
  MedusaAddress,
  MedusaCustomer,
  MedusaCustomerAddress,
  MedusaOrder,
  MedusaOrderItem,
  MedusaRegion,
  MedusaRegionCountry,
  MedusaShippingOption,
  MedusaShippingMethod,
  MedusaMoneyAmount,
  MedusaPaymentSession,
  MedusaPaymentCollection,
  MedusaAuthResponse,
} from './types.js'

// Mappers (for custom usage or extending)
export {
  mapMedusaProduct,
  mapMedusaCategory,
  mapMedusaCart,
  mapMedusaCustomer,
  mapMedusaAddress,
  mapMedusaOrder,
  mapMedusaRegionsToStoreInfo,
  mapMedusaRegionsToCountries,
  mapMedusaShippingOption,
} from './mappers/index.js'
