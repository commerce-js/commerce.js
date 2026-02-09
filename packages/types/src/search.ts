// ---------------------------------------------------------------------------
// Search domain types
// ---------------------------------------------------------------------------

import type { LocalizedString, Maybe, PaginatedResult } from './common.js'
import type { Product } from './product.js'

/** Sort direction */
export type SortDirection = 'asc' | 'desc'

/** Sort option */
export interface SortOption {
  field: string
  direction: SortDirection
}

/** Search / listing input params */
export interface SearchParams {
  query?: string
  categoryId?: string
  sort?: SortOption
  filters?: Record<string, string | string[]>
  page?: number
  perPage?: number
}

/** A single facet value (e.g., "Red" under "Color") */
export interface FacetValue {
  label: LocalizedString
  value: string
  count: number
  selected: boolean
}

/** A filterable facet (e.g., "Color", "Size", "Brand") */
export interface Facet {
  name: LocalizedString
  code: string
  values: FacetValue[]
}

/** Search result response */
export interface SearchResult {
  products: PaginatedResult<Product>
  facets: Facet[]
  suggestions: Maybe<string[]>
}
