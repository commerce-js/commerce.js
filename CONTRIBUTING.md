# Contributing to CommerceJS

Thanks for your interest in CommerceJS! This guide covers everything you need to contribute
to the open-source packages.

## What's open to contribution

All packages under `packages/` are MIT-licensed and open to contributions — the type system,
core orchestrator, checkout engine, platform engine, Nuxt module, UI components, adapters
(Salla, Medusa), and providers (payments, delivery, notifications, analytics, storage).

The applications under `apps/` are part of the CommerceJS Cloud product. The `storefront`,
`hosted-checkout`, and `docs` apps welcome fixes and improvements; the `dashboard` (cloud
control plane) is maintained by the core team.

**New adapters and providers are the most valuable contribution.** Implement the interfaces
from `@commercejs/types`, pass the contract tests, and ship — see the
[adapter development guide](https://commerce.js.org/guides/adapter-development).

## Development setup

```bash
# Requirements: Node.js >= 20 (22 recommended), pnpm 9.15.4
git clone https://github.com/commerce-js/commerce.js.git
cd commerce.js
pnpm install
pnpm build          # build all packages (turbo)
pnpm test           # run all tests
pnpm typecheck      # type-check everything
```

Work on a single package:

```bash
pnpm --filter @commercejs/checkout build
pnpm --filter @commercejs/checkout test
```

## Project structure

```
packages/   # Published npm packages (@commercejs/*) — MIT, open source
apps/       # Applications (storefront, hosted-checkout, docs, dashboard)
.plans/     # Roadmap and implementation plans
.memory/    # Architecture decisions and project knowledge base
```

Read `.memory/decisions.md` before proposing architectural changes — it records the locked
decisions and their rationale.

## Making changes

1. Fork and create a feature branch from `main`.
2. Make your changes. Match the existing code style (TypeScript strict, ESM, explicit imports
   in `@commercejs/ui` components — no auto-import reliance).
3. Add or update tests. Adapters must pass the contract test suite.
4. If your change affects a published package, add a changeset:
   ```bash
   pnpm changeset
   ```
   Pick the affected package(s), the bump type (`patch` for fixes, `minor` for features),
   and write a short summary — it becomes the changelog entry.
5. Open a PR. CI runs build + typecheck + tests; all must pass.

## Guidelines

- **Solve the problem that exists, not theoretical ones.** Prefer clean, robust architecture
  over clever solutions.
- **Keep the unified types unified.** Changes to `@commercejs/types` affect every adapter —
  discuss in an issue first.
- **Platform queries stay at ORM parity** (`main` branch): when adding a Drizzle query, add
  the Prisma equivalent, then run `bash packages/platform/scripts/check-query-parity.sh`.
- **No breaking changes without a major bump** and a migration note in the changeset.

## Releases

Merges to `main` with changesets trigger the release workflow: a "Version Packages" PR is
opened automatically, and merging it publishes to npm via OIDC trusted publishing.

## Questions

Open a GitHub issue or start a discussion. For security reports, please email the maintainer
rather than opening a public issue.
