# Checkpoint — CommerceJS Cloud

## Current Phase
Cloud Platform — Phase 7

## Status
Real-time deploy status via SSE implemented. Queues created and deployed.

## What's Done
- GitHub OAuth login + repo picker
- Push-to-deploy via GitHub webhooks
- Cloudflare Queue for async deploy jobs (`cjs-deploy-queue` + DLQ)
- **Real-time deploy status via SSE** ← just completed
  - SSE endpoint polls D1 every 2s, emits only on status change
  - `useDeployStream` composable replaces 3s setInterval polling
  - Auto-closes on terminal states, refreshes deployment list

## Next Step
- Preview environments for every PR (webhook handler + Neon branching)
- Custom domains (CF API wiring + dashboard UI)
- Build logs viewer

## Key Files
- `apps/dashboard/wrangler.jsonc` — Queue producer + consumer config
- `apps/dashboard/server/utils/deploy-queue.ts` — Shared types + `sendDeployJob()`
- `apps/dashboard/server/utils/deploy-provisioner.ts` — Shared provisioning logic
- `apps/dashboard/server/plugins/deploy-consumer.ts` — Queue consumer
- `apps/dashboard/server/plugins/deploy-dlq.ts` — DLQ consumer
- `apps/dashboard/server/api/projects/[id]/deploy.post.ts` — Slim queue producer (was 262 lines, now 77)

## Blockers
None
