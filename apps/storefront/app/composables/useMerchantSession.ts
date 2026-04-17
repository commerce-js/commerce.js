// ---------------------------------------------------------------------------
// useMerchantSession — wraps GET /api/admin/auth/session
// ---------------------------------------------------------------------------
//
// Client-side session reader for the admin UI. Returns the current signed-in
// merchant-staff user, or null when unauthenticated. The underlying route
// is served by apps/dashboard (see api/admin/auth/session.get.ts) — the
// merchant-host browser origin reaches it through Fly → dashboard (the
// dashboard's storefront-proxy keeps /api/* on :3000).
//
// SSR note: admin pages are CSR-only (definePageMeta({ ssr: false })), so
// this composable runs in the browser. The storefront's own Nitro process
// has no /api/admin/* routes — calling it server-side would 404. If a
// future page needs SSR'd admin data, add a catch-all proxy at
// apps/storefront/server/routes/api/admin/[...].ts that forwards to
// http://localhost:3000 (the dashboard).
//
// Cached in a single useState key so repeated reads across the layout,
// middleware, and pages share one fetch per navigation.
// ---------------------------------------------------------------------------

export interface MerchantSessionUser {
  id: string
  email: string
  name: string | null
  role: 'owner' | 'admin' | 'editor'
}

const SESSION_STATE_KEY = 'merchant-session'

export function useMerchantSession() {
  const user = useState<MerchantSessionUser | null>(SESSION_STATE_KEY, () => null)

  async function fetchSession(): Promise<MerchantSessionUser | null> {
    try {
      const data = await $fetch<MerchantSessionUser | null>('/api/admin/auth/session', {
        credentials: 'include',
      })
      user.value = data ?? null
      return user.value
    }
    catch {
      user.value = null
      return null
    }
  }

  async function logout(): Promise<void> {
    try {
      await $fetch('/api/admin/auth/logout', { method: 'POST', credentials: 'include' })
    }
    finally {
      user.value = null
    }
  }

  function clear(): void {
    user.value = null
  }

  return {
    user,
    fetchSession,
    logout,
    clear,
  }
}
