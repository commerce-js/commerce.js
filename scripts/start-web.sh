#!/bin/bash
# ---------------------------------------------------------------------------
# Web-process supervisor
# ---------------------------------------------------------------------------
# Runs the dashboard Nitro server (:3000) and the storefront Nitro server
# (:3001) side-by-side inside one Fly machine. Fly delivers all HTTPS
# traffic to :3000; the dashboard's `server/middleware/00.storefront-proxy.ts`
# decides per-request whether to keep the request or hand it off to :3001
# via localhost.
#
# Why one machine instead of Fly's process-group model?
#
#   T04's design calls for inter-process calls over `localhost`. Fly's
#   native [processes] spawns separate machines per process group, so
#   localhost wouldn't cross machines; we'd have to use `.internal` DNS
#   and pay a sub-millisecond network hop per internal call. A single
#   supervised machine keeps the request path simpler, avoids DNS setup,
#   and matches the mental model in the task spec.
#
# Why bash?
#
#   We use `wait -n` to block until the first child exits. That's a bash
#   (and ksh) extension; dash (Debian's /bin/sh) doesn't implement it.
#   node:22-slim ships bash at /bin/bash, so we just require it.
#
# Signal / restart semantics:
#
#   tini is PID 1 (via Dockerfile ENTRYPOINT) but Fly's init wraps it, so
#   it runs as non-PID-1 — that's a harmless warning. Zombie reaping is
#   handled by bash waiting on its own children below. We trap SIGTERM/
#   SIGINT and forward them. When either child exits, we tear the other
#   down and exit non-zero so Fly restarts the whole machine.
# ---------------------------------------------------------------------------
set -eu

: "${PORT:=3000}"                            # dashboard
: "${STOREFRONT_PORT:=3001}"                 # storefront
: "${NUXT_COMMERCE_REMOTE_API_BASE:=http://localhost:${PORT}/api/storefront}"

# Dashboard listens on $HOST:$PORT = 0.0.0.0:3000 by default.
echo "[start-web] launching dashboard on :${PORT}"
PORT="${PORT}" node .output/server/index.mjs &
WEB_PID=$!

# Nitro reads PORT / NITRO_PORT — override per-child so the storefront
# binds to 3001 instead of inheriting the same 3000 above. Env is scoped
# inline so it doesn't leak into the dashboard.
echo "[start-web] launching storefront on :${STOREFRONT_PORT}"
PORT="${STOREFRONT_PORT}" \
NITRO_PORT="${STOREFRONT_PORT}" \
NUXT_COMMERCE_REMOTE_API_BASE="${NUXT_COMMERCE_REMOTE_API_BASE}" \
  node apps/storefront/.output/server/index.mjs &
STORE_PID=$!

shutdown() {
  echo "[start-web] shutdown signal received — stopping children"
  kill -TERM "${WEB_PID}" "${STORE_PID}" 2>/dev/null || true
  wait "${WEB_PID}" "${STORE_PID}" 2>/dev/null || true
  exit 0
}
trap shutdown TERM INT HUP

# Block until whichever child exits first. Teardown the peer so Fly
# restarts the whole machine and we don't limp along half-alive.
wait -n "${WEB_PID}" "${STORE_PID}"
EXIT_CODE=$?
echo "[start-web] a child exited (code=${EXIT_CODE}) — tearing down peer"
kill -TERM "${WEB_PID}" "${STORE_PID}" 2>/dev/null || true
wait "${WEB_PID}" "${STORE_PID}" 2>/dev/null || true
exit "${EXIT_CODE}"
