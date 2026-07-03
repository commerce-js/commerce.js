# Verification Matrix

The exact commands every change must pass before a PR. Mirrors CI plus the
runtime smokes CI can't do. "Green" here is a hard gate — a stage without it
is not done.

## Gates (run from repo root)

```bash
pnpm install                                   # exits 0 — @prisma/engines postinstall skipped by config
pnpm turbo run build typecheck --filter='!@commercejs/dashboard' --filter='!docs'   # all tasks successful
pnpm vitest run                                # all projects green (types, adapters, checkout, payment-tap, platform, dashboard)
bash packages/platform/scripts/check-query-parity.sh   # "in sync" (Drizzle ↔ Prisma barrels)
pnpm --filter @commercejs/dashboard build      # nuxt build + esbuild worker bundle (.output/worker.mjs)
node apps/dashboard/.output/worker.mjs --dry-run   # exits 0, prints config presence
```

## Runtime smoke (dashboard web process)

```bash
NUXT_SESSION_PASSWORD="test-password-at-least-32-characters!!" PORT=3999 \
  node apps/dashboard/.output/server/index.mjs &
curl -s localhost:3999/api/_health                                   # {"ok":true,"sessionSealSecure":true,...}
curl -s -o /dev/null -w "%{http_code}\n" localhost:3999/api/merchants # 401 (operator auth guard)
# Unknown tenant on the storefront surface must 404/503, never 500:
curl -s -o /dev/null -w "%{http_code}\n" -H "Host: no-such.commercejs.cloud" \
  localhost:3999/api/storefront/store
kill %1
```

## Notes

- Live-DB suites (`platform.drizzle.test.ts`, `platform.prisma.test.ts`) skip
  without `DATABASE_URL` — intended; they need a real Neon branch.
- Generated Prisma clients are committed, so builds never download engines.
  The `pnpm.neverBuiltDependencies: ["@prisma/engines"]` entry skips the
  proxy-hostile postinstall.
- Never trust a piped exit code (`cmd | tail` reports tail's status). Use
  `${PIPESTATUS[0]}` or run the command bare.

## Per-stage checklist

- `git status --short` clean of build artifacts (`node-compile-cache/`,
  `.data/`, `.output/`, `coverage/` are gitignored).
- Commits conventional, signed as `Claude <noreply@anthropic.com>`.
- Push verified via `git ls-remote origin <branch>` == local HEAD.
