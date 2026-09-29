# Architecture

What this repository is, how it is put together, what state it is in, and what to
work on next.

## What this is

CommerceJS is a monorepo holding two related products.

The first is an open-source toolkit. Eighteen packages published to npm as
`@commercejs/*` give JavaScript and TypeScript projects one eCommerce API that
several backend platforms can sit behind. The idea is that Salla, Shopify, Medusa
and WooCommerce each speak a different dialect, so a project that wants to support
more than one would otherwise rewrite its commerce layer for each. Here, each
platform is an adapter that maps its own API onto one shared set of types, and the
rest of the codebase keeps talking to that.

The second is a hosted product. The `platform` package is a commerce engine backed
by Postgres, the `nuxt` package turns any Nuxt app into a storefront with a REST API
generated for it, `ui` supplies the components, and `cloud` and `cli` provision and
deploy it. `apps/dashboard` is the control panel for that.

The two halves are deliberately coupled in one direction only: everything depends on
`types`, and the higher layers depend on the lower ones. The toolkit does not require
the hosted platform, and the hosted platform does not require the toolkit.

At the time of writing the repository is mid-pivot. `main` targets Cloudflare Pages
and Workers, and there is a plan to rebuild the hosted product on Fly.io as a
multi-tenant service. `packages/cloud` and the Cloudflare-specific parts of
`apps/dashboard` are the code that pivot is aimed at. `CLAUDE.md` records the
decisions behind that pivot; the `.plans/` directory holds the migration plan.

## Layout

```
packages/          18 published packages, 389 source files
  types/           the shared data model every other package speaks
  core/            createCommerce(), event bus, webhook dispatcher, orchestrator
  checkout/        checkout state machine
  platform/        commerce engine: Drizzle + Prisma, Neon Postgres, admin API
  nuxt/            Nuxt module: composables and generated REST routes
  ui/              33 eCommerce components built on Nuxt UI
  adapter-salla/   Salla platform adapter
  adapter-medusa/  Medusa V2 platform adapter
  payment-tap/     Tap Payments
  delivery-armada/ Armada last-mile delivery
  delivery-parcel/ Parcel delivery
  notification-resend/, notification-smtp/   email providers
  analytics-ga/    GA4 provider
  storage-s3/      S3-compatible storage
  webhook-verifier/  HMAC signature verification
  cloud/           Cloudflare provisioning (being replaced by the Fly.io work)
  cli/             deploy, init, env commands

apps/              private, 190 source files
  storefront/      reference Nuxt 4 storefront
  hosted-checkout/ deployable checkout with embedded Tap card elements
  dashboard/       hosted-product control panel
  docs/            documentation site for commerce.js.org
  landing-page/, pitch-deck/, cloud-landing-page/, cloud-pitch-deck/
                   single self-contained index.html files, no build
```

## How the pieces fit

`createCommerce()` in `core` is the single entry point. It takes an adapter, optional
payment, notification, analytics, storage and delivery providers, and an optional set
of webhook endpoints, and returns a facade whose methods check whether the underlying
adapter actually supports the requested capability before calling it.

Around that sit three kinds of extension point:

Domains are the CRUD surface, where `catalog`, `cart`, `orders` and `customers` fall
into three tiers by how much support a platform realistically has. Universal domains
such as `catalog` and `store` are expected everywhere. Common domains such as `cart`,
`checkout` and `orders` are expected from real integrations. Specialized domains such
as `wholesale` and `subscriptions` only exist where a platform supports them.

Adapters implement those domains against one specific platform. They are the only code
that knows an external API exists.

Providers are the side effects, and they are event-driven rather than called directly.
A payment provider is handed a `CheckoutSession` from `checkout`; notification,
analytics and delivery providers are driven by events on the bus. This is what lets a
provider be swapped without touching checkout logic.

`platform` is the one implementation of the adapter contract that is not an external
API. It talks to Postgres, and it is also where the admin API and the profile system
live.

## State of the repository

Where things stand, measured rather than estimated:

- 18 packages build and typecheck clean.
- 403 tests pass across 20 source files. Before this branch, `pnpm test` ran 10 of the
  24 test files in the repository, because the root Vitest config registered only 6 of
  18 packages. `core`'s 59 tests were never executed by `pnpm test` or by CI. The four
  still excluded are the `cloud` and `platform` integration suites, which need live
  credentials and a real database.
- `pnpm lint` covers all 31 workspace projects and reports no errors. It leaves 545
  `no-explicit-any` warnings on purpose, as a ratchet rather than a wall.
- CI runs build, typecheck, lint and tests on every pull request.

## What was improved in this change

The branch this document shipped in added linting to the repository and fixed what it
found. Linting was declared at the root but implemented nowhere except `apps/docs`, so
`pnpm lint` silently did nothing for 17 packages and 3 apps, and CI never ran it.

Tooling:

- A root ESLint flat config covering the 18 packages, with a `lint` script wired into
  each so the existing `turbo run lint` plumbing picks them up.
- `@nuxt/eslint` added to the storefront, and both Nuxt apps now generate their own
  ESLint config as part of `lint`. Previously a fresh clone could not lint them at all,
  because the generated config was missing and the failure was masked by a
  cross-platform bug in `postinstall`.
- `postinstall` used `nuxt prepare || true`, and `true` is not a command on Windows, so
  it failed there instead of being tolerated. Changed to `|| exit 0`, which behaves the
  same on both platforms.
- A lint step in CI, so all of this is enforced rather than advisory.

Defects found and fixed:

- `platform` wishlist items always returned an empty image gallery. Images live in a
  separate table that this code path never queried, and the unused `img` helper it
  imported was the tell.
- `ui` declared `<slot name="title" :name="productName">` in 6 components. The dynamic
  `name` overrides the slot's own `name`, so a consumer's `#title` never matched. The
  bound prop is now `:title`, consistent with the `:price` and `:rating` slots beside it.
- `platform` accepted a `timeout` option in its test suite and never applied it, so 46
  database tests ran against Vitest's 5 second default.
- `platform/scripts/create-delivery-job.cjs` had a committed Armada API token. It now
  reads `ARMADA_API_KEY`. The committed token should be rotated, since it is in git
  history.
- `core` did not typecheck on `main`. Its tsconfig omitted `DOM` from `lib` while the
  code uses `globalThis.fetch` and `setTimeout`, so `pnpm typecheck` and CI were red
  before this branch started.
- `adapter-medusa` took a `currency` argument that had no effect, because each variant
  carries its own currency in the API response. Removed.
- `adapter-salla` had a `toPrice` helper and two hand-rolled copies of the same price
  construction. Both now call the helper.
- 3 `delivery-armada` tests asserted the pre-v2 Armada API and had been failing
  unnoticed because those tests never ran.

This change did not touch behaviour beyond those fixes, and it deliberately left
`packages/cloud` and `apps/dashboard` alone since both are being replaced by the
Fly.io work.

## What to improve next

Ordered by value per unit of effort.

Lint the two remaining apps. `apps/dashboard` and `apps/hosted-checkout` have no ESLint
config, and hosted-checkout carries roughly 70 `any` usages and 40 `console` calls. The
`lint` script and the config pattern are in place from this change, so this is mostly
counting and fixing.

Typecheck the apps. Only `docs` and `dashboard` have a `typecheck` script.
`storefront` and `hosted-checkout` are excluded from the CI typecheck step, which means
edits to their `.vue` files are unchecked. Adding `vue-tsc` to both would close the gap
that let the stale-slot bugs in `ui` reach the storefront unnoticed.

Turn on type-aware linting. The current rules are syntax-level. Adding
`tseslint.configs.recommendedTypeChecked` would catch floating promises and unsafe
`any` propagation, at the cost of a slower lint.

Reduce `any`. 545 warnings is a ceiling, not a target. The largest concentrations are
`platform` at 207, `ui` at 199, and the Google Maps integration in the storefront, which
would be fixed properly by installing `@types/google.maps`.

Adopt a formatter. There is none, so formatting is enforced nowhere and the 25
`font-bold` to `font-semibold` changes in this branch had to be mechanical. Prettier
with an import-sort plugin, run through lint-staged or a `turbo format` task, would
remove a whole category of review noise.

Fix the remaining drift. `CLAUDE.md` documents an `.agent/` directory of rules and
workflows and a `.research/` directory that are not in the repository. `types`,
`adapter-salla` and `adapter-medusa` have test files but no `test` script of their own,
so they only run through the root Vitest config, and `webhook-verifier` is missing a
`typecheck` script. `apps/storefront/app/composables/usePrice.ts` is dead: the module's
own `usePrice` shadows it, which Nuxt warns about on every prepare.

Admin gaps. `admin/categories.ts` can create, update and delete categories but has no
list method, so the admin API cannot enumerate them. The unused `findCategories` query
import that lint flagged was the symptom.

Rotate the leaked Armada token, and consider adding secret scanning to CI. One
credential in one dev script is unlikely to be the last.

Close the coverage blind spot deliberately. `packages/platform` has the largest
surface in the repository and no tests that run without a live database. A
PGlite-backed variant of the existing Drizzle and Prisma suites would let CI exercise
the engine.
