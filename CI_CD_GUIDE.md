# CI/CD Guide

This project uses **GitHub Actions** for CI/CD and **Changesets** for version management.

## For everyday development

Your workflow doesn't change much. Just push code and open PRs like normal.

### What happens automatically

| Event            | What runs                        | Where to see it                                               |
| ---------------- | -------------------------------- | ------------------------------------------------------------- |
| You open a PR    | Build + Typecheck + Tests        | PR checks (green ✅ or red ❌)                                |
| You merge to `main` | Release workflow checks for changesets | [Actions tab](https://github.com/commerce-js/commerce.js/actions) |

### When you want to publish a new version

1. **Make your code changes** as usual
2. **Run `pnpm changeset`** from the root of the monorepo
3. **Answer the prompts:**
   - Which package(s) changed? → Use arrow keys + space to select
   - What kind of change? →
     - `patch` (0.1.0 → 0.1.**1**) — Bug fixes
     - `minor` (0.1.0 → 0.**2**.0) — New features (backward compatible)
     - `major` (0.1.0 → **1**.0.0) — Breaking changes
   - Write a short summary → This becomes the changelog entry
4. **Commit the generated `.changeset/*.md` file** with your PR
5. **Merge your PR** to `main`
6. The Release workflow will open a PR titled **"chore: version packages"**
7. **Merge that PR** → packages are published to npm 🎉

### If you DON'T want to publish

Just don't run `pnpm changeset`. No changeset file = no version bump = no publish. The CI checks still run as normal.

## One-time setup

### Trusted Publishing (required for npm publish)

npm uses **Trusted Publishing** with OIDC — no tokens needed! GitHub Actions proves its identity to npm directly.

**For each package you want to publish:**

1. Go to [npmjs.com](https://www.npmjs.com) → find your package → **Settings**
2. Scroll to **Trusted Publishers** → click **Add trusted publisher**
3. Select **GitHub Actions** and fill in:
   - **Organization/user:** `commerce-js`
   - **Repository:** `commerce.js`
   - **Workflow filename:** `release.yml`
4. Save

> **Note:** For brand-new packages that don't exist on npm yet, you'll need to publish the first version manually with `npm publish --access public` from the package directory. After that, set up trusted publishing as above.

### npm organization (required for @commercejs scope)

If the `@commercejs` scope doesn't exist yet on npm:

1. Go to [npmjs.com](https://www.npmjs.com)
2. Click your profile → **Add Organization**
3. Name it `commercejs`
4. Add any team members who should be able to publish

## Troubleshooting

| Problem                           | Solution                                                               |
| --------------------------------- | ---------------------------------------------------------------------- |
| CI fails with "frozen lockfile"   | Run `pnpm install` locally, commit the updated `pnpm-lock.yaml`       |
| Release fails with 403/401        | Ensure Trusted Publishing is configured for that package on npmjs.com  |
| "Package already published"       | The version in `package.json` already exists on npm — make a new changeset |
| Tests pass locally but fail in CI | CI uses `--frozen-lockfile` — make sure `pnpm-lock.yaml` is committed |
| First publish fails               | New packages must be published manually once before trusted publishing works |
