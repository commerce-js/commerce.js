# Checkpoint

## Current Phase

**Lint + bug-fix pass on `main` — shipped on `chore/eslint-and-bugfixes`**

The `fly/eaas` migration has not started. This branch is quality work on `main`
instead: it adds the linting the repo declared but never had, and fixes the defects
that surfaced. `ARCHITECTURE.md` (new, at the repo root) documents the project and
lists what to do next.

## What this branch changed

### Tooling (the gap that prompted it)

`package.json` declared `"lint": "turbo run lint"` and `turbo.json` had a `lint` task,
but only `apps/docs` had a `lint` script. Everything else — all 18 packages and 3 apps
— was silently unlinted, and CI never ran lint.

- Root `eslint.config.mjs` covers the 18 packages (typescript-eslint + Vue for
  `packages/ui`). `no-undef` is off because `tsc` already does it with types.
  `no-explicit-any` is a warning, as a ratchet.
- `"lint": "eslint ."` added to all 18 package.json files.
- `@nuxt/eslint` added to `apps/storefront`; both `storefront` and `docs` now use
  `"lint": "nuxt prepare && eslint ."` so linting works on a fresh clone and in CI.
- `turbo.json` lint task now `dependsOn: ["^build"]`.
- CI gained a lint step.

### Bugs fixed

- `core` did not typecheck on `main`: tsconfig lacked `DOM` in `lib` while the code
  uses `globalThis.fetch` and `setTimeout`. CI was red before this branch.
- `platform` wishlist returned an empty image gallery (images are a separate table).
- `platform` `findProducts` used raw SQL for `gte`/`lte` instead of Drizzle helpers.
- `platform` `platformTestSuite` accepted a `timeout` option and never applied it.
- `platform/scripts/create-delivery-job.cjs` had a committed Armada API token, now
  `ARMADA_API_KEY`. **The committed token needs rotating — it is in git history.**
- `ui` had `<slot name="title" :name="...">` in 6 components, which overrides the
  slot's own name so `#title` never matched. Now `:title`.
- `adapter-medusa` `mapMedusaProduct` had a dead `currency` argument; removed
  (breaking for direct callers of the exported mapper).
- `adapter-salla` product mapper duplicated price construction instead of using its
  own `toPrice` helper.
- `storefront` product page passed a non-reactive slug to `useProduct`, so navigating
  between products showed a stale product. `useProduct` already accepted a getter.
- `storefront` had a dead local `usePrice` usage; the module's version shadows it.
- `hosted-checkout` `cart-pay` left orders stuck in `pending` forever when the Tap
  session could not be created. Now cancelled, guarded so the original error wins.
- `hosted-checkout` hardcoded `saveCard: true` server-side while the frontend already
  tracked consent in `saveCardSelected` and never sent it. Now sent and honoured.
- `hosted-checkout` `useTapCard.tokenize()` never cleared its 30s timer and leaked the
  error watcher on success.
- 3 stale `delivery-armada` tests asserted the pre-v2 Armada API.

### Tests

The root `vitest.config.ts` registered only 6 of 18 packages, so `pnpm test` ran 14 of
24 test files. `core`'s 59 tests never ran in CI. Now 24 files / 447 tests, up from
14 / 294. `cloud` and `platform` stay excluded: they need live credentials or a DB.

### Typography

The storefront loaded Inter from Google Fonts but never applied it — no `--font-sans`
token existed, so Nuxt UI's default stack won and the font request was wasted. Fixed
with a `@theme { --font-sans }` token. Font weights trimmed to 400/500/600, and all 25
`font-bold` in the storefront and `packages/ui` reduced to `font-semibold`.

## State after this branch

- `pnpm lint` — 31/31 projects, 0 errors, 545 `any` warnings (intentional)
- `pnpm turbo run build typecheck --filter="./packages/*"` — 35/35 green
- `pnpm test` — 24 files, 447 tests green
- Changeset added covering 6 packages

## Immediate next steps

1. Rotate the leaked Armada token (`main_50380d6b76a34cf441f48bdmddag9r6`).
2. Merge this PR and watch CI.
3. Resume the Fly.io migration: `.plans/fly-migration-plan.md`, starting with
   `git checkout -b fly/eaas`. The pre-migration Prisma work in Step 1 of that plan
   is already done — `packages/platform` is on Prisma 7.6 with `runtime = "nodejs"`
   and `@prisma/adapter-neon`.

## Known follow-ups (full list in ARCHITECTURE.md)

- `dashboard` and `hosted-checkout` still have no ESLint config
- `storefront` and `hosted-checkout` have no `typecheck` script and are excluded from
  the CI typecheck step
- No formatter, so formatting is enforced nowhere
- `platform` has the largest surface and no tests that run without a live database
- `admin/categories.ts` has no list method
- `CLAUDE.md` references an `.agent/` directory and `.research/` that do not exist
