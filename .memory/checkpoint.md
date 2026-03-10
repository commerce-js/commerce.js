# Checkpoint

## Current Phase
Phase 7 — Cloud Platform (Sprint 1 Complete)

## Status
CI deploy issue resolved (0.6.10→0.6.21). Root cause: `addServerHandler` bypasses Nitro's auto-import pipeline. Fix: `addServerScanDir` + zero-import handler sources. All deploy pipelines functional. Ready for next sprint planning.

## Last Commits
- `fix(nuxt): use addServerScanDir for full auto-import support` — replaced ~90 lines of registerApiRoutes/addTemplate with single addServerScanDir call
- Handler source files (74 files) stripped of all explicit imports

## Current npm version
`@commercejs/nuxt@0.6.21`

## What's Working
- Dashboard at `commercejs-cloud` on CF Pages (GitHub OAuth, project CRUD, deploy trigger)
- GH Actions deploy pipeline (template repo → user repo → auto-deploy)
- Cloudflare Queues for async provisioning with DLQ + retry
- D1 schema with projects, deployments, env vars, domains tables
- **Nuxt module server routes deploy successfully to CF Workers** (via addServerScanDir)

## Next Steps
1. Verify full end-to-end flow works in production (create project → auto-deploy → storefront live)
2. Plan Phase 7 Sprint 2 (billing, logs viewer, admin features, polish)
3. Clean up test projects (demo-shop, final-test)

## Detailed Checkpoint
See [2026-03-10T1230.md](checkpoints/2026-03-10T1230.md)
