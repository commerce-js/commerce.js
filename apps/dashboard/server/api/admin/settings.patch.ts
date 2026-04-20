// ---------------------------------------------------------------------------
// PATCH /api/admin/settings — update the merchant's store settings
// ---------------------------------------------------------------------------

import { defineEventHandler, readBody, createError } from 'h3'
import { requireMerchantSession } from '../../utils/merchant-auth'
import { parseOrThrow } from '../../utils/admin-validate'
import { updateStoreSettingsSchema } from '../../utils/admin-schemas'
import { recordActivity } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  await requireMerchantSession(event)

  const admin = event.context.admin
  if (!admin) {
    throw createError({ statusCode: 500, statusMessage: 'Admin context missing' })
  }

  const body = await readBody(event)
  const input = parseOrThrow(updateStoreSettingsSchema, body)

  const settings = await admin.updateStoreSettings(input)
  await recordActivity(event, 'settings.updated', 'settings', null, {
    changedKeys: Object.keys(input),
  })
  return settings
})
