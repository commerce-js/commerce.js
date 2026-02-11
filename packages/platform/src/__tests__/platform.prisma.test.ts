// ---------------------------------------------------------------------------
// @commercejs/platform — Prisma driver tests
// ---------------------------------------------------------------------------

import { vi } from 'vitest'

// Mock the barrel to directly use Prisma queries
vi.mock('../database/index.js', async () => {
  return await import('../database/prisma/queries/index.js')
})

import { describe } from 'vitest'
import { initPrisma } from '../database/prisma/client.js'
import { migratePrisma } from '../database/prisma/migrate.js'
import { seedPrisma } from '../database/prisma/seed.js'
import { platformTestSuite } from './platform.suite.js'

describe('@commercejs/platform [prisma]', () => {
  platformTestSuite({
    setup: async () => {
      initPrisma(':memory:')
      await migratePrisma()
      await seedPrisma()
    },
    setupEmpty: async () => {
      initPrisma(':memory:')
      await migratePrisma()
    },
  })
})
