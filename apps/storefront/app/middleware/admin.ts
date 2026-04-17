// ---------------------------------------------------------------------------
// admin route middleware — redirects unauthenticated /admin/** visits to
// /admin/login, preserving the intended path as ?redirect=.
// ---------------------------------------------------------------------------
//
// Applied per-page via definePageMeta({ middleware: 'admin' }) so the buyer
// storefront bundle never pulls in the session-fetch code. The middleware
// is CSR-only — it returns immediately on the server pass because admin
// pages themselves set ssr: false, and the storefront Nitro has no
// /api/admin/* proxy route (calls from SSR would 404). Session verification
// happens when the browser hydrates the admin layout.
// ---------------------------------------------------------------------------

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const { user, fetchSession } = useMerchantSession()

  if (!user.value) {
    await fetchSession()
  }

  if (!user.value) {
    return navigateTo({
      path: '/admin/login',
      query: { redirect: to.fullPath },
    })
  }
})
