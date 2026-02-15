// ---------------------------------------------------------------------------
// @commercejs/core — createCompositeOrchestrator()
// ---------------------------------------------------------------------------
// Composes domains from multiple adapter sources into a single orchestrator.
// Each domain slot is independently assignable, enabling multi-source setups
// like: catalog from Shopify + cart/checkout from Platform + customers from CRM.
// ---------------------------------------------------------------------------

import type {
  CommerceOrchestrator,
  DomainMap,
  CatalogAdapter,
  StoreAdapter,
} from '@commercejs/types'
import { createOrchestrator } from './orchestrator.js'

// ---- Configuration ----

export interface CompositeOrchestratorConfig {
  /** Unique identifier for this composite orchestrator */
  name: string

  /**
   * Domain providers — each key maps to the adapter providing that domain.
   *
   * `catalog` and `store` are required (Tier 1: Universal).
   * All other domains are optional.
   *
   * @example
   * ```ts
   * createCompositeOrchestrator({
   *   name: 'multi-source',
   *   providers: {
   *     catalog: shopifyAdapter,
   *     store: shopifyAdapter,
   *     cart: platformAdapter,
   *     checkout: platformAdapter,
   *     customers: crmAdapter,
   *   },
   * })
   * ```
   */
  providers: {
    catalog: CatalogAdapter
    store: StoreAdapter
  } & Partial<DomainMap>
}

// ---- Factory ----

/**
 * Create a composite orchestrator that routes each domain to a different
 * adapter source. This is the "mix and match" pattern.
 *
 * @example
 * ```ts
 * const orch = createCompositeOrchestrator({
 *   name: 'hybrid',
 *   providers: {
 *     catalog: shopifyAdapter,
 *     store: shopifyAdapter,
 *     cart: platformAdapter,
 *     checkout: platformAdapter,
 *   },
 * })
 *
 * // catalog calls go to Shopify
 * const product = await orch.getProduct({ id: 'prod_1' })
 *
 * // cart calls go to Platform
 * const cart = await orch.domain('cart').createCart()
 * ```
 */
export function createCompositeOrchestrator(
  config: CompositeOrchestratorConfig,
): CommerceOrchestrator {
  const { name, providers } = config
  const { catalog, store, ...optionalDomains } = providers

  return createOrchestrator({
    name,
    catalog,
    store,
    domains: optionalDomains,
  })
}
