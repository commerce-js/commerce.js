// ---------------------------------------------------------------------------
// POST /api/sessions/[id]/confirm — Confirm payment after 3DS redirect
// ---------------------------------------------------------------------------
// Body: { chargeId? } — optional, uses stored session ID if not provided
// Returns: { sessionId, ...snapshot }
// ---------------------------------------------------------------------------

import { sessions } from '../index.post'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || !sessions.has(id)) {
    throw createError({ statusCode: 404, message: 'Session not found' })
  }

  const body = await readBody(event).catch(() => ({}))
  const session = sessions.get(id)!

  try {
    await session.confirmPayment(body?.chargeId)

    return {
      sessionId: id,
      ...session.toSnapshot(),
    }
  }
  catch (err) {
    const message = err instanceof Error ? err.message : 'Payment confirmation failed'
    // Return the snapshot even on error so the UI can show state
    return {
      sessionId: id,
      error: message,
      ...session.toSnapshot(),
    }
  }
})
