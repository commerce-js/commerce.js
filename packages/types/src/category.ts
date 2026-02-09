// ---------------------------------------------------------------------------
// Category domain types
// ---------------------------------------------------------------------------

import type { Id, Image, LocalizedString, Maybe } from './common.js'

/** Product category */
export interface Category {
  id: Id
  name: LocalizedString
  slug: string
  description: Maybe<LocalizedString>
  image: Maybe<Image>
  parentId: Maybe<Id>
  children: Category[]
  productCount: Maybe<number>
}
