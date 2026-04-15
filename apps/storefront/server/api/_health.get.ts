// Liveness probe for the storefront process.
// Fly's health checker hits /api/_health directly on the container's
// listening port; the supervisor's restart semantics trigger when this
// stops responding.
export default defineEventHandler(() => ({
  ok: true,
  service: 'commercejs-storefront',
  ts: Date.now(),
}))
