// ---------------------------------------------------------------------------
// @commercejs/core — createOrchestrator() factory
// ---------------------------------------------------------------------------
// Creates a CommerceOrchestrator from universal domains + optional domains.
// This is the runtime implementation of the three-tier domain model.
// ---------------------------------------------------------------------------

import type {
  CommerceOrchestrator,
  DomainMap,
  AdapterDomain,
  CatalogAdapter,
  StoreAdapter,
} from '@commercejs/types'
import { CommerceError } from '@commercejs/types'

// ---- Configuration ----

export interface OrchestratorConfig {
  /** Unique identifier for this orchestrator instance */
  name: string

  /** Tier 1: Universal domains — catalog and store (required) */
  catalog: CatalogAdapter
  store: StoreAdapter

  /** Tier 2 + 3: Optional domains */
  domains?: Partial<DomainMap>
}

// ---- Domain key → AdapterDomain mapping ----

const DOMAIN_KEY_TO_CAPABILITY: Record<keyof DomainMap, AdapterDomain> = {
  cart: 'cart',
  checkout: 'checkout',
  orders: 'orders',
  customers: 'customers',
  wishlist: 'wishlist',
  reviews: 'reviews',
  promotions: 'promotions',
  brands: 'brands',
  countries: 'countries',
  locations: 'locations',
  returns: 'returns',
  wholesale: 'wholesale',
  auctions: 'auctions',
  rentals: 'rentals',
  giftCards: 'gift-cards',
}

// ---- Factory ----

/**
 * Create a `CommerceOrchestrator` from explicit universal domains + optional domains.
 *
 * @example
 * ```ts
 * const orch = createOrchestrator({
 *   name: 'my-store',
 *   catalog: sallaAdapter,
 *   store: sallaAdapter,
 *   domains: {
 *     cart: platformAdapter,
 *     checkout: platformAdapter,
 *     customers: sallaAdapter,
 *   },
 * })
 *
 * if (orch.supports('cart')) {
 *   const cart = await orch.domain('cart').createCart()
 * }
 * ```
 */
export function createOrchestrator(config: OrchestratorConfig): CommerceOrchestrator {
  const { name, catalog, store, domains = {} } = config

  // Build capabilities list from available domains
  const capabilities: AdapterDomain[] = ['catalog', 'store']
  for (const [key, adapter] of Object.entries(domains)) {
    if (adapter != null && key in DOMAIN_KEY_TO_CAPABILITY) {
      capabilities.push(DOMAIN_KEY_TO_CAPABILITY[key as keyof DomainMap])
    }
  }

  return {
    // Tier 1: Universal — catalog methods
    getProduct: catalog.getProduct.bind(catalog),
    getProducts: catalog.getProducts.bind(catalog),
    getCategories: catalog.getCategories.bind(catalog),

    // Tier 1: Universal — store methods
    getStoreInfo: store.getStoreInfo.bind(store),

    // Orchestrator identity
    name,
    capabilities,
    domains,

    supports<D extends keyof DomainMap>(domain: D): boolean {
      return domains[domain] != null
    },

    domain<D extends keyof DomainMap>(domain: D): NonNullable<DomainMap[D]> {
      const adapter = domains[domain]
      if (adapter == null) {
        throw new CommerceError(
          `Orchestrator "${name}" does not support the "${String(domain)}" domain`,
          'NOT_SUPPORTED',
        )
      }
      return adapter as NonNullable<DomainMap[D]>
    },
  }
}
