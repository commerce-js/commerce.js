// ---------------------------------------------------------------------------
// Integrations schema — stores provider configs (e.g. Armada access tokens)
// ---------------------------------------------------------------------------

import { pgTable, text, jsonb, timestamp } from 'drizzle-orm/pg-core'

export const integrations = pgTable('integrations', {
  // Provider key: 'armada', 'parcel', 'tap', etc.
  provider: text('provider').primaryKey(),

  // Access token or primary credential
  accessToken: text('access_token'),

  // Full config blob (merchant info, branch IDs, settings, etc.)
  config: jsonb('config').$type<Record<string, unknown>>(),

  // Connection status
  status: text('status').notNull().default('disconnected'),

  // Timestamps
  connectedAt: timestamp('connected_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
