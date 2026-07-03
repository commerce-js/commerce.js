# Contributing to CommerceJS

Thanks for your interest in CommerceJS! This guide covers local setup, the
development workflow, and how CI/CD and releases work.

## Prerequisites

- [Node.js](https://nodejs.org/) v22+
- [pnpm](https://pnpm.io/) v9+ (`corepack enable` will pin the version from `package.json`)

## Local setup

```bash
git clone https://github.com/commerce-js/commerce.js.git
cd commerce.js
pnpm install
pnpm turbo run build
```

## Development workflow

```bash
pnpm turbo run build        # build all packages
pnpm turbo run typecheck    # type-check everything
pnpm vitest run             # run the test suite
pnpm --filter <pkg> dev     # run one package/app in watch mode
```

Before opening a PR, make sure these pass locally:

```bash
pnpm turbo run build typecheck
pnpm vitest run
```

The monorepo layout: published SDK packages live in `packages/` (`@commercejs/*`),
private apps live in `apps/`. See the root `README.md` for the full package map.

## Continuous Integration

CI runs on every pull request via **GitHub Actions**:

| Event | What runs | Where to see it |
| --- | --- | --- |
| You open a PR | Build + Typecheck + Tests (+ coverage) | PR checks (green ✅ or red ❌) |
| You merge to `main` | Release workflow checks for changesets | [Actions tab](https://github.com/commerce-js/commerce.js/actions) |

If a check fails, fix it before merging. Common causes:

| Problem | Fix |
| --- | --- |
| CI fails with "frozen lockfile" | Run `pnpm install` locally and commit the updated `pnpm-lock.yaml` |
| Tests pass locally but fail in CI | CI uses `--frozen-lockfile`; make sure `pnpm-lock.yaml` is committed |
| Release fails with 403/401 | Ensure Trusted Publishing is configured for that package on npmjs.com |
| "Package already published" | The version in `package.json` already exists — make a new changeset |

## Releasing (Changesets)

This monorepo uses [Changesets](https://github.com/changesets/changesets) for
versioning and publishing. Publishing is automated — you only ever write a
changeset.

1. Make your code changes.
2. Run `pnpm changeset` from the repo root.
3. Answer the prompts:
   - **Which package(s) changed?** — arrow keys + space to select.
   - **What kind of change?**
     - `patch` (0.1.0 → 0.1.**1**) — bug fixes
     - `minor` (0.1.0 → 0.**2**.0) — new features (backward compatible)
     - `major` (0.1.0 → **1**.0.0) — breaking changes
   - **Summary** — becomes the changelog entry.
4. Commit the generated `.changeset/*.md` file with your PR.
5. Merge your PR to `main`.
6. The Release workflow opens a **"chore: version packages"** PR.
7. Merging that PR publishes the updated packages to npm. 🎉

**Don't want to publish?** Just don't add a changeset. No changeset = no version
bump = no publish. CI checks still run as normal.

### Trusted Publishing (one-time, per package)

npm publishing uses **Trusted Publishing** with OIDC — no tokens needed. GitHub
Actions proves its identity to npm directly.

For each package you want to publish:

1. On [npmjs.com](https://www.npmjs.com), open the package → **Settings**.
2. **Trusted Publishers** → **Add trusted publisher**.
3. Select **GitHub Actions** and fill in:
   - **Organization/user:** `commerce-js`
   - **Repository:** `commerce.js`
   - **Workflow filename:** `release.yml`
4. Save.

> Brand-new packages that don't yet exist on npm must be published once manually
> (`npm publish --access public` from the package directory) before Trusted
> Publishing works.

### npm organization (`@commercejs` scope)

If the `@commercejs` scope doesn't exist on npm yet: on npmjs.com, profile →
**Add Organization** → name it `commercejs`, then add publishers.

## Reporting issues

Found a bug or have a suggestion? [Open an issue](https://github.com/commerce-js/commerce.js/issues)
and include a description, steps to reproduce, expected vs. actual behavior, and
the package name and version.

## License

By contributing you agree that your contributions are licensed under the
[MIT License](LICENSE).
