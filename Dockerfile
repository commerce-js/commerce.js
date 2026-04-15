# syntax=docker/dockerfile:1.7
# ---------------------------------------------------------------------------
# CommerceJS Cloud — Fly.io image (apps/dashboard)
# ---------------------------------------------------------------------------
# Multi-stage build:
#   base    → node:22-slim with pnpm via corepack
#   build   → installs deps, generates Prisma clients, builds dashboard +
#             the BullMQ worker bundle (.output/worker.mjs)
#   runtime → minimal layer that runs either the Nitro server or the
#             worker, depending on the fly.toml process type (see CMD /
#             [processes] block in fly.toml).
# ---------------------------------------------------------------------------

FROM node:22-slim AS base
# OpenSSL is required by Prisma's engine binary (without it, postinstall
# defaults to openssl-1.1.x which isn't on node:22-slim by default).
# ca-certificates lets Prisma + ofetch validate Neon / Upstash TLS.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
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

RUN pnpm install --frozen-lockfile

# Generate Prisma clients (platform merchant DB + dashboard control DB).
# The dashboard's prisma.config.ts reads NEON_CONTROL_DB_URL at load time
# (Prisma 7 strict env resolution); `prisma generate` itself doesn't need
# a live DB — provide a placeholder so the config loads, and the real
# secret is injected at runtime via Fly secrets.
RUN cd packages/platform && npx prisma generate
RUN cd apps/dashboard \
    && NEON_CONTROL_DB_URL="postgresql://placeholder@localhost:5432/placeholder" \
       npx prisma generate

# Build the workspace deps the dashboard imports at runtime. Nitro
# resolves @commercejs/platform / @commercejs/types via their `main`
# fields (./dist/index.js); without these dist trees the dashboard build
# fails with "Could not load …/dist/index.js: ENOENT".
# `--filter @commercejs/dashboard...` builds the dashboard's transitive
# deps in dependency order (types → platform).
RUN pnpm --filter '@commercejs/dashboard...' --filter '!@commercejs/dashboard' build

# `pnpm --filter dashboard build` runs `nuxt build && pnpm build:worker`,
# producing .output/server/index.mjs AND .output/worker.mjs.
RUN pnpm --filter dashboard build

# Collect runtime node_modules for the worker process (esbuild bundles the
# worker with `--packages=external`, so we need node_modules at runtime).
# Nitro already bundles its deps into .output/server — we only need a
# separate tree for worker.mjs.
RUN pnpm --filter @commercejs/dashboard deploy --prod /tmp/worker-deploy

# ---------------------------------------------------------------------------
# Runtime stage
# ---------------------------------------------------------------------------
FROM base AS runtime
WORKDIR /app
COPY --from=build /app/apps/dashboard/.output .output/
COPY --from=build /tmp/worker-deploy/node_modules node_modules/

ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

# Default CMD is the web server; the fly.toml `[processes]` block
# overrides this for the `worker` machine to run `node .output/worker.mjs`.
CMD ["node", ".output/server/index.mjs"]
