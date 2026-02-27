# Checkpoint — CommerceJS Cloud

## Current Phase
Cloud Platform — Phase 7

## Status
Queue-based async deploy implemented. All deploy provisioning now goes through Cloudflare Queues instead of floating promises.

## What's Done
- GitHub OAuth login + repo picker
- Push-to-deploy via GitHub webhooks
- Live deploy status in dashboard
- **Cloudflare Queue for async deploy jobs** ← just completed
  - `cjs-deploy-queue` with DLQ (`cjs-deploy-dlq`)
  - Queue consumer with idempotency, per-message error handling, retry classification
  - Local dev fallback (inline provisioning when no queue binding)

## Next Step
- Create the queues on Cloudflare: `wrangler queues create cjs-deploy-queue && wrangler queues create cjs-deploy-dlq`
- Deploy dashboard to CF Pages and verify queue-based deploy flow end-to-end
- Consider adding deploy status polling/SSE for real-time dashboard updates

## Key Files
- `apps/dashboard/wrangler.jsonc` — Queue producer + consumer config
- `apps/dashboard/server/utils/deploy-queue.ts` — Shared types + `sendDeployJob()`
- `apps/dashboard/server/utils/deploy-provisioner.ts` — Shared provisioning logic
- `apps/dashboard/server/plugins/deploy-consumer.ts` — Queue consumer
- `apps/dashboard/server/plugins/deploy-dlq.ts` — DLQ consumer
- `apps/dashboard/server/api/projects/[id]/deploy.post.ts` — Slim queue producer (was 262 lines, now 77)

## Blockers
None
