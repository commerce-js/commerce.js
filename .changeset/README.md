# Changesets

This folder is managed by [Changesets](https://github.com/changesets/changesets).

## What is this?

When you make a change to a publishable package, you create a **changeset** — a small markdown file that describes what changed and whether it's a patch, minor, or major version bump.

## How to use

After making changes, run:

```bash
pnpm changeset
```

This will ask you:
1. **Which packages changed?** — Select the ones you modified.
2. **What kind of change?** — `patch` (bug fix), `minor` (new feature), or `major` (breaking change).
3. **Summary** — A short description of what changed (this becomes the changelog entry).

A new `.md` file will appear in this folder. **Commit it with your PR.**

When your PR merges to `main`, the release workflow will collect all changesets and open a "Version Packages" PR that bumps versions and updates changelogs. Merging *that* PR publishes to npm.
