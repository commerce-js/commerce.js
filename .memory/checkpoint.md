# Checkpoint

## Current Phase
Cloud Platform — Deploy Pipeline Implementation

## Status
GitHub Actions deploy pipeline implemented. Template repos auto-deploy to CF Pages on push.

## Last Commits
- `616c947` — fix: remove cache:pnpm from deploy workflow (needs lockfile)
- `268e967` — fix: use tweetnacl for GH secrets encryption
- `7491b39` — feat: add GitHub Actions deploy pipeline for storefronts

## Remaining
- Dashboard CF Pages needs to redeploy with commit `268e967` to enable auto-setting of GH secrets
- Once redeployed: new projects will auto-deploy storefronts end-to-end
- Wildcard DNS for `*.commercejs.cloud` still needed

## Detailed Checkpoint
See [2026-02-28T0530.md](checkpoints/2026-02-28T0530.md)

## Next Step
- Verify dashboard redeploy picked up tweetnacl fix
- Test full end-to-end: create project → auto-set secrets → GH Actions builds → domain live
- Phase 7 remaining tasks: T01-T05 (see `.plans/phase-7-cloud/tasks/`)
