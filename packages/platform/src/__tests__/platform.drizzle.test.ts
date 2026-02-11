// ---------------------------------------------------------------------------
// @commercejs/platform — Drizzle driver tests
// ---------------------------------------------------------------------------

import { vi } from 'vitest'

// Mock the barrel to directly use Drizzle queries
vi.mock('../database/index.js', async () => {
  return await import('../database/drizzle/queries/index.js')
})

import { describe } from 'vitest'
import { initDrizzle } from '../database/drizzle/client.js'
import { migrateDrizzle } from '../database/drizzle/migrate.js'
import { seedDrizzle } from '../database/drizzle/seed.js'
import { platformTestSuite } from './platform.suite.js'

describe('@commercejs/platform [drizzle]', () => {
  platformTestSuite({
    setup: () => {
      const db = initDrizzle(':memory:')
      migrateDrizzle(db)
      seedDrizzle(db)
    },
    setupEmpty: () => {
      const db = initDrizzle(':memory:')
      migrateDrizzle(db)
    },
  })
})
