# CommerceJS Cloud — Deploy Runbook (Fly.io)

The platform already runs in production (`app.commercejs.cloud`, merchant
storefronts at `*.commercejs.cloud`, hosted checkout at
`checkout.commercejs.cloud` — Fly app `commercejs-cloud`, region `fra`).
This runbook covers redeploys, fresh environments, and smoke verification.

## Topology

One Fly machine image, two processes (root `fly.toml`):

- **web** — `scripts/start-web.sh` supervises three Node servers over
  localhost: dashboard `:3000` (public — also hostname-routes storefront
  traffic to `:3001` and checkout hosts to `:3002` via
  `server/middleware/00.storefront-proxy.ts`), storefront `:3001`,
  hosted-checkout `:3002`. If any child exits, the supervisor tears the
  machine down and Fly restarts it.
- **worker** — `node .output/worker.mjs`, BullMQ consumer for
  `merchant-jobs` (`provision-store`, `send-email`, `dispatch-webhook`).

Data: control DB on Neon (`NEON_CONTROL_DB_URL`) + one Neon **project per
merchant** created by the provisioner; Redis (Upstash) backs the queue;
Tigris (S3) holds media under `merchants/<id>/` prefixes.

## Redeploy (normal case)

```bash
fly deploy                     # builds via root Dockerfile, both processes
fly logs --app commercejs-cloud
curl -s https://app.commercejs.cloud/api/_health   # expect {"status":"ok",...}
```

Control-DB schema changes ship as Prisma migrations
(`apps/dashboard/prisma/migrations/`) — apply before or with the deploy:

```bash
cd apps/dashboard
NEON_CONTROL_DB_URL="postgresql://…-pooler…/neondb" npx prisma migrate deploy
```

> The repo skips Prisma engine downloads at install (`neverBuiltDependencies`);
> `migrate deploy` fetches the schema engine on demand on first use.

## Fresh environment (from zero)

1. **Neon**: create project `cjs-control` (region `aws-eu-central-1`), run
   `prisma migrate deploy` against it (above), create an API key for
   provisioning.
2. **Upstash**: create a Redis DB → `rediss://…` URL.
3. **Tigris/S3**: `fly storage create` (or any S3) → endpoint, keys, bucket.
4. **Fly**:
   ```bash
   fly launch --name commercejs-cloud --region fra --no-deploy   # uses ./fly.toml
   fly secrets set \
     NEON_CONTROL_DB_URL="postgresql://…-pooler…/neondb" \
     NEON_API_KEY="neon_api_key_…" \
     REDIS_URL="rediss://…" \
     NUXT_SESSION_PASSWORD="$(openssl rand -hex 32)" \
     COMMERCEJS_BASE_HOST="commercejs.cloud" \
     AWS_ENDPOINT_URL_S3="https://fly.storage.tigris.dev" \
     AWS_REGION="auto" AWS_ACCESS_KEY_ID="…" AWS_SECRET_ACCESS_KEY="…" \
     BUCKET_NAME="…"
   fly deploy
   fly certs add "commercejs.cloud" && fly certs add "*.commercejs.cloud" \
     && fly certs add "app.commercejs.cloud" && fly certs add "checkout.commercejs.cloud"
   ```
5. **DNS** (DNS-only, no proxying): `commercejs.cloud`, `*.commercejs.cloud`,
   `app.`, `checkout.` → `commercejs-cloud.fly.dev` (or the dedicated IPv4).
6. **First operator**: `POST /api/auth/register` self-closes after the first
   dashboard user exists — register immediately after the first boot.

## Smoke test (after every deploy)

```bash
curl -s https://app.commercejs.cloud/api/_health                     # 200 ok
# Operator API requires a session (401 without — this is the auth guard):
curl -s -o /dev/null -w "%{http_code}\n" https://app.commercejs.cloud/api/merchants   # 401
```

Then in the dashboard UI: create a test merchant → status flips
`provisioning → active` in ~15–40s (watch `fly logs` for the worker) →
`https://<subdomain>.commercejs.cloud` renders the storefront → merchant
detail page: mint an API key and
`curl -H "X-Commerce-Key: <key>" https://app.commercejs.cloud/api/storefront/store`.
Finally delete the test merchant with `?hard=true` and confirm the Neon
project disappears from the Neon console (the delete now tears it down).

## Troubleshooting

| Symptom | Check |
|---|---|
| Merchant stuck `provisioning` | worker logs; `merchant.provisionError` on the detail response; Neon 423/429/5xx retry automatically (2s×5) |
| Merchant `failed` | `provisionError` says why (bad `NEON_API_KEY`, quota…); fix, then `POST /api/merchants/:id/provision` |
| 401 on `/api/merchants` | expected without a dashboard session — log in via `/api/auth/login` |
| Subdomain 404s | wildcard DNS + cert + `COMMERCEJS_BASE_HOST` must match the Host header |
| Worker idle | `fly scale show` — worker process count ≥1; `REDIS_URL` reachable |
| Machine restart loops | one of the three web children is crashing — `fly logs` shows which port exited first |

## Costs & scaling notes

Auto-suspend web + small worker ≈ $5–15/mo base; each merchant adds a
scale-to-zero Neon project (≈ $1–2/mo active). Watch the Neon **account
project quota** — when approaching it, adopt the branch-per-merchant
sharding lever documented in `.plans/grand-plan.md`.
