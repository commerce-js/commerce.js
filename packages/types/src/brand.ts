// ---------------------------------------------------------------------------
// Brand types
// ---------------------------------------------------------------------------

import type { Id, LocalizedString, Maybe, Image } from './common.js'

/** A product brand */
export interface Brand {
  id: Id
  /** Display name */
  name: LocalizedString
  /** URL-friendly slug */
  slug: string
  /** Brand logo */
  logo: Maybe<Image>
  /** Brand description */
  description: Maybe<LocalizedString>
  /** Whether the brand is active/visible */
  isActive: boolean
}
