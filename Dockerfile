# syntax=docker/dockerfile:1.7
# ---------------------------------------------------------------------------
# CommerceJS Cloud — Fly.io image (apps/dashboard)
# ---------------------------------------------------------------------------
# Multi-stage build:
#   base    → node:20-slim with pnpm via corepack
#   build   → installs deps, generates Prisma clients, builds dashboard +
#             the BullMQ worker bundle (.output/worker.mjs)
#   runtime → minimal layer that runs either the Nitro server or the
#             worker, depending on the fly.toml process type (see CMD /
#             [processes] block in fly.toml).
# ---------------------------------------------------------------------------

FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

# ---------------------------------------------------------------------------
# Build stage
# ---------------------------------------------------------------------------
FROM base AS build
WORKDIR /app

# Copy workspace manifests + lockfile first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/ packages/
COPY apps/dashboard/ apps/dashboard/

RUN pnpm install --frozen-lockfile

# Generate Prisma clients (platform merchant DB + dashboard control DB).
RUN cd packages/platform && npx prisma generate
RUN cd apps/dashboard && npx prisma generate

# `pnpm --filter dashboard build` runs `nuxt build && pnpm build:worker`,
# producing .output/server/index.mjs AND .output/worker.mjs.
RUN pnpm --filter dashboard build

# Collect runtime node_modules for the worker process (esbuild bundles the
# worker with `--packages=external`, so we need node_modules at runtime).
# Nitro already bundles its deps into .output/server — we only need a
# separate tree for worker.mjs.
RUN cd apps/dashboard && pnpm deploy --prod --legacy /tmp/worker-deploy

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
