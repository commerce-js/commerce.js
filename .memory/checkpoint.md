# Checkpoint

## Current Phase
Phase 7 — Cloud Platform (Sprint 1 Complete)

## Status
All 5 sprint tasks (T01-T05) completed. Deploy pipeline functional: Dashboard creates CF Pages + Neon DB, sets GH Actions secrets on user repos, triggers workflow dispatch. Nuxt module route issue on CF Workers was resolved. Ready for next sprint planning.

## Last Commits
- `1d1162b` — fix(nuxt): replace addServerScanDir with explicit addServerHandler registration
- `d68c1b5` — fix(nuxt): strip defineRouteMeta from API route files
- `dfc6264` — fix(nuxt): inject adapter name into server-side runtimeConfig

## Current npm version
`@commercejs/nuxt@0.6.0`

## What's Working
- Dashboard at `commercejs-cloud` on CF Pages (GitHub OAuth, project CRUD, deploy trigger)
- GH Actions deploy pipeline (template repo → user repo → auto-deploy)
- Cloudflare Queues for async provisioning with DLQ + retry
- D1 schema with projects, deployments, env vars, domains tables

## Next Steps
1. Verify full end-to-end flow works in production (create project → auto-deploy → storefront live)
2. Plan Phase 7 Sprint 2 (billing, logs viewer, admin features, polish)
3. Clean up test projects (demo-shop, final-test)

## Detailed Checkpoint
See [2026-03-10T0450.md](checkpoints/2026-03-10T0450.md)
