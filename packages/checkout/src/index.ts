// ---------------------------------------------------------------------------
// @commercejs/checkout — Universal checkout engine
// ---------------------------------------------------------------------------

export { CheckoutSession } from './checkout-session.js'
export { EventEmitter } from './events.js'
export { buildTransitions } from './types.js'
export type {
  CheckoutState,
  CheckoutChannel,
  CheckoutFulfillment,
  CheckoutSessionConfig,
  ResolvedCheckoutConfig,
  CheckoutCustomerInfo,
  CheckoutSnapshot,
  CheckoutEvents,
} from './types.js'
