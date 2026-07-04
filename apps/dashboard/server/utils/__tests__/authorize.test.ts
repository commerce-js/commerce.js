import { describe, expect, it } from 'vitest'
import { authorizeDashboardSession } from '../authorize'
import type { DashboardSession } from '../session'

const admin: DashboardSession = { userId: 'u1', email: 'a@x.dev', name: 'A', role: 'admin' }
const support: DashboardSession = { userId: 'u2', email: 's@x.dev', name: 'S', role: 'support' }

describe('authorizeDashboardSession', () => {
  it('401s when there is no session, for any access level', () => {
    expect(authorizeDashboardSession(null, 'read')).toMatchObject({ ok: false, status: 401 })
    expect(authorizeDashboardSession(null, 'admin')).toMatchObject({ ok: false, status: 401 })
  })

  it('lets any authenticated operator read', () => {
    expect(authorizeDashboardSession(admin, 'read')).toMatchObject({ ok: true })
    expect(authorizeDashboardSession(support, 'read')).toMatchObject({ ok: true })
  })

  it('allows admin actions only for the admin role', () => {
    expect(authorizeDashboardSession(admin, 'admin')).toMatchObject({ ok: true })
    expect(authorizeDashboardSession(support, 'admin')).toMatchObject({ ok: false, status: 403 })
  })

  it('returns the session on success', () => {
    const decision = authorizeDashboardSession(admin, 'admin')
    expect(decision.ok && decision.session).toBe(admin)
  })
})
