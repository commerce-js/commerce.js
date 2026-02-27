// ---------------------------------------------------------------------------
// Auth middleware — client-side redirect for unauthenticated users
// ---------------------------------------------------------------------------

export default defineNuxtRouteMiddleware(async (to) => {
  // Skip auth check for login page and auth API routes
  if (to.path === '/login' || to.path.startsWith('/api/')) {
    return
  }

  try {
    // useRequestFetch() forwards browser cookies during SSR
    const fetch = import.meta.server ? useRequestFetch() : $fetch
    const session = await fetch<{ authenticated: boolean }>('/api/auth/session')
    if (!session.authenticated) {
      return navigateTo('/login')
    }
  }
  catch {
    return navigateTo('/login')
  }
})
