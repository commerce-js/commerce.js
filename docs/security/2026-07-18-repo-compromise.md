# 2026-07-18 repository compromise — record and prevention

## What happened

Between 13:59 and 14:16 UTC on 2026-07-18, someone holding a credential for the
owner's GitHub account force-pushed rewritten history to eight branches of this
repo (main, phase/cloud-identity, fly/eaas, claude/ecommerce-saas-planning-mus9v7,
claude/commercejs-m0-m05-push-il5lep, ci/setup-cicd, changeset-release/main,
add-claude-github-actions-1783023106074) and to three branches of
manifesto-js/manifesto minutes earlier. Each rewritten commit kept the original
author, dates and message and differed from the original only in config /
script / entry files (ten on main):

- every `nuxt.config.ts` and `app.config.ts` under apps/ and packages/ui,
  `packages/cli/src/cli.ts`, `packages/nuxt/scripts/fix-esm-extensions.mjs`,
  `packages/platform/scripts/migrate.mjs`
- prepended `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`
- appended, after ~900 spaces on the last line, `eval("global.o='5-3-243-du';"+atob('...'))`

Anything that imports a nuxt config (`nuxt prepare`, `nuxt build`), runs the
CLI, or runs those scripts executes the loader. Technique matches the DPRK
"Contagious Interview" hidden-config-payload style. The credential was rolled.

## Recovery (2026-09-04)

The original commits were still on GitHub by SHA (from the repo activity log)
and were verified clean: `git grep -l 5-3-243-du <sha>` returned nothing and a
full-content diff against each forgery showed only the injection lines. Every
branch was force-pushed back to its pre-attack SHA with a lease on the forged
SHA; a fresh clone was then scanned across all 492 reachable commits. The
forged commits remain fetchable by SHA until GitHub garbage-collects them.

## Prevention

- `scripts/ci/security-guard.mjs` — fixed-string scan of every tracked file for
  the loader fragments, `atob(` on config/script/entry surfaces, and the
  single-parent "Merge pull request" tell. Ported from xyzhub/orderly.
- `.github/workflows/guard.yml` — runs it on every push, no path filter.
- `ci.yml`, `release.yml`, `deploy-docs.yml` — run it first; their jobs `needs:` it,
  so a poisoned tree never reaches install, build, npm publish, or Pages deploy.
- Before pulling or building any ref: `git grep -l 5-3-243-du <ref>`.
- Recommended: branch protection on `main` with force pushes blocked.
