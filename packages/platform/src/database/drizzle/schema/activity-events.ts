// ---------------------------------------------------------------------------
// Activity events schema — append-only audit log
// ---------------------------------------------------------------------------

import { pgTable, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core'

export const activityEvents = pgTable('activity_events', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  actorId: text('actor_id'),
  actorEmail: text('actor_email').notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id'),
  diff: jsonb('diff'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  createdAtIdx: index('activity_events_created_at_idx').on(t.createdAt),
  actorIdx: index('activity_events_actor_id_idx').on(t.actorId),
  entityIdx: index('activity_events_entity_idx').on(t.entityType, t.entityId),
}))
