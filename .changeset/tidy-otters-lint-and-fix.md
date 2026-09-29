---
'@commercejs/platform': patch
'@commercejs/ui': patch
'@commercejs/adapter-medusa': patch
'@commercejs/adapter-salla': patch
'@commercejs/checkout': patch
'@commercejs/core': patch
---

Add workspace-wide ESLint and fix the defects it surfaced

Quality tooling:

- Add a root ESLint flat config for the 18 workspace packages and a `lint` script to
  each, so `pnpm lint` (and the new CI lint step) actually covers the repo instead of
  only `apps/docs`.
- Add `@nuxt/eslint` to the storefront and make the docs and storefront lint scripts
  generate their own Nuxt ESLint config (`nuxt prepare && eslint .`), so linting works
  on a fresh clone and in CI where install scripts are skipped.
- `no-undef` is off: `tsc` already reports undefined identifiers with type information.
- `no-explicit-any` is a warning rather than an error, to ratchet the existing `any`
  usage down instead of forcing a 500-site rewrite in one change.

Bugs fixed:

- platform: wishlist items always returned an empty product gallery. Product images now
  resolve through `findProductImages`.
- platform: `findProducts` built its `gte`/`lte` conditions from raw SQL fragments
  instead of Drizzle's typed helpers.
- platform: `platformTestSuite`'s `timeout` option was accepted but never applied, so
  database tests ran with Vitest's 5s default. All 46 tests in the suite now use it.
- platform: `scripts/create-delivery-job.cjs` had a committed Armada API token. It now
  reads `ARMADA_API_KEY` from the environment. **That token should be rotated.**
- ui: `<slot name="title" :name="...">` overrode the slot's own `name` attribute, so
  `#title` overrides never matched. The bound prop is now `:title`, matching the
  `:price`/`:rating` convention used by the other slots.
- adapter-medusa: `mapMedusaProduct`'s `currency` argument had no effect (currency comes
  from each variant's API response) and has been removed. The argument is a breaking
  change for direct callers of the exported mapper.
- adapter-salla: the product mapper built price objects twice by hand while leaving its
  own `toPrice` helper unused; both call sites now use it.
- checkout: the `expired` event payload was typed `{}`, which accepts primitives. It is
  now `Record<string, never>`.
- core: `tsconfig` was missing `"DOM"` in `lib`, so `globalThis.fetch` and `setTimeout`
  did not typecheck. `pnpm typecheck` failed on `main` before this change.

Tests:

- Register the remaining hermetic packages as Vitest projects. The root config listed 6
  of 18 packages, so `pnpm test` ran 10 of the repository's 24 test files, and `core`'s
  59 tests were never executed by `pnpm test` or CI. It now runs 20 files and 403 tests.
  `cloud` and `platform` stay excluded, since their tests need live credentials or a
  real database.
- Stop `types` and `webhook-verifier` running their suites twice: tsc emits the compiled
  tests into `dist`, which neither project excluded.
- Update three stale `delivery-armada` expectations that still asserted the pre-v2
  Armada API (`/estimate/static`, `origin_format: "branch"`, flat `payment_type`).
