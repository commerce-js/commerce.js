// ---------------------------------------------------------------------------
// GET /api/sessions/[id] — Get checkout session state
// ---------------------------------------------------------------------------

import { sessions, sessionMeta } from '../index.post'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || !sessions.has(id)) {
    throw createError({ statusCode: 404, message: 'Session not found' })
  }

  const session = sessions.get(id)!
  const meta = sessionMeta.get(id)

  return {
    sessionId: id,
    tapPublicKey: meta?.tapPublicKey || '',
    ...session.toSnapshot(),
  }
})
