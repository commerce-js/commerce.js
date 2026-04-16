# syntax=docker/dockerfile:1.7
# ---------------------------------------------------------------------------
# CommerceJS Cloud — Fly.io image (dashboard + storefront + hosted-checkout + worker)
# ---------------------------------------------------------------------------
# Multi-stage build:
#   base    → node:22-slim with pnpm via corepack
#   build   → installs deps, generates Prisma clients, builds
#             dashboard (.output/server + .output/worker.mjs) AND
#             storefront (apps/storefront/.output/server)
#   runtime → minimal layer that runs either the web supervisor
#             (dashboard + storefront side-by-side) or the worker,
#             depending on the fly.toml process type.
# ---------------------------------------------------------------------------

FROM node:22-slim AS base
# OpenSSL is required by Prisma's engine binary (without it, postinstall
# defaults to openssl-1.1.x which isn't on node:22-slim by default).
# ca-certificates lets Prisma + ofetch validate Neon / Upstash TLS.
# tini is our PID 1 — it reaps zombies when the supervisor spawns child
# node processes and forwards signals cleanly on Fly's stop semantics.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates tini \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@latest --activate

# ---------------------------------------------------------------------------
# Build stage
# ---------------------------------------------------------------------------
FROM base AS build
WORKDIR /app

# Copy workspace manifests + lockfile + the root tsconfig that every
# package's tsconfig.json `extends`. Without tsconfig.base.json, Prisma's
# config loader (tsx) fails before it can resolve the schema path.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json ./
COPY packages/ packages/
COPY apps/dashboard/ apps/dashboard/
COPY apps/storefront/ apps/storefront/
COPY apps/hosted-checkout/ apps/hosted-checkout/
# start-web.sh lives in scripts/ — copied here so the runtime stage can
# promote it without re-copying the whole repo.
COPY scripts/ scripts/

RUN pnpm install --frozen-lockfile

# Generate Prisma clients (platform merchant DB + dashboard control DB).
# Both prisma.config.ts files read their respective URL env var at load
# time (Prisma 7 strict env resolution); `prisma generate` itself doesn't
# need a live DB — provide placeholders so the config loads, and the real
# secrets are injected at runtime via Fly secrets.
RUN cd packages/platform \
    && DATABASE_URL="postgresql://placeholder@localhost:5432/placeholder" \
       npx prisma generate
RUN cd apps/dashboard \
    && NEON_CONTROL_DB_URL="postgresql://placeholder@localhost:5432/placeholder" \
       npx prisma generate

# Build the workspace deps once — the dashboard, storefront, and
# hosted-checkout all import @commercejs/platform / @commercejs/types at
# runtime, and the storefront also needs @commercejs/nuxt / @commercejs/ui.
# `--filter '...'` builds a package plus its transitive deps in order.
RUN pnpm --filter '@commercejs/dashboard...' --filter '!@commercejs/dashboard' \
         --filter 'storefront...'            --filter '!storefront' \
         --filter 'hosted-checkout...'       --filter '!hosted-checkout' \
         build

# `pnpm --filter dashboard build` runs `nuxt build && pnpm build:worker`,
# producing .output/server/index.mjs AND .output/worker.mjs.
RUN pnpm --filter dashboard build

# Storefront's build emits a node-server bundle at
# apps/storefront/.output/server/index.mjs. No worker involvement.
RUN pnpm --filter storefront build

# Hosted checkout — card payments via Tap. Same node-server preset.
RUN pnpm --filter hosted-checkout build

# Collect runtime node_modules for the worker process (esbuild bundles the
# worker with `--packages=external`, so we need node_modules at runtime).
# Nitro already bundles its deps into both .output/server trees — this
# tree is for worker.mjs only.
RUN pnpm --filter @commercejs/dashboard deploy --prod /tmp/worker-deploy

# ---------------------------------------------------------------------------
# Runtime stage
# ---------------------------------------------------------------------------
FROM base AS runtime
WORKDIR /app

# Dashboard .output lives at the project root so existing CMDs
# (node .output/server/index.mjs / .output/worker.mjs) keep working.
COPY --from=build /app/apps/dashboard/.output .output/
# Storefront .output sits alongside it. The supervisor launches
# `node apps/storefront/.output/server/index.mjs` on port 3001.
COPY --from=build /app/apps/storefront/.output apps/storefront/.output/
# Hosted checkout .output — launched on port 3002 by the supervisor.
COPY --from=build /app/apps/hosted-checkout/.output apps/hosted-checkout/.output/
# Worker runtime deps.
COPY --from=build /tmp/worker-deploy/node_modules node_modules/
# Supervisor script that runs the web + storefront processes together.
COPY --from=build /app/scripts/start-web.sh scripts/start-web.sh

ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000 3001 3002

# tini acts as PID 1 so child signals and zombies are handled cleanly.
# Default CMD is the web supervisor (dashboard + storefront). The
# fly.toml `[processes]` block overrides this for the `worker` machine.
ENTRYPOINT ["/usr/bin/tini", "--"]
# bash, not /bin/sh: the supervisor uses `wait -n` which dash doesn't
# implement. node:22-slim ships bash at /bin/bash.
CMD ["/bin/bash", "scripts/start-web.sh"]
