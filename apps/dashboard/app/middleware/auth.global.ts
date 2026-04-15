// ---------------------------------------------------------------------------
// Auth middleware — client-side redirect for unauthenticated operators
// ---------------------------------------------------------------------------
//
// Runs on every route navigation. If a page explicitly opts out of auth
// (`definePageMeta({ auth: false })`) we skip; otherwise we require a
// live dashboard session or bounce to /login.
// ---------------------------------------------------------------------------

export default defineNuxtRouteMiddleware(async (to) => {
  // Skip auth on pages that opted out (login, public marketing, etc.)
  if ((to.meta as { auth?: boolean }).auth === false) return

  // Never gate the API path prefix (middleware runs on Nuxt page navs anyway)
  if (to.path.startsWith('/api/')) return

  try {
    const fetch = import.meta.server ? useRequestFetch() : $fetch
    const session = await fetch<{ user: unknown | null }>('/api/auth/session')
    if (!session.user) {
      return navigateTo('/login')
    }
  }
  catch {
    return navigateTo('/login')
  }
})
