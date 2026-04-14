# syntax=docker/dockerfile:1.7
# ---------------------------------------------------------------------------
# CommerceJS Cloud — Fly.io image (apps/dashboard)
# ---------------------------------------------------------------------------
# Multi-stage build:
#   base    → node:20-slim with pnpm via corepack
#   build   → installs deps, generates Prisma clients, builds dashboard
#   runtime → minimal layer that runs the Nitro node-server output
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

# Generate Prisma clients (platform + control DB).
# Step 2 of the migration adds apps/dashboard/prisma/schema.prisma — until
# then this line is a no-op safety net (commented to avoid build failures).
RUN cd packages/platform && npx prisma generate
# RUN cd apps/dashboard && npx prisma generate

RUN pnpm --filter dashboard build

# ---------------------------------------------------------------------------
# Runtime stage
# ---------------------------------------------------------------------------
FROM base AS runtime
WORKDIR /app
COPY --from=build /app/apps/dashboard/.output .output/

ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
