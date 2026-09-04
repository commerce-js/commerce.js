#!/usr/bin/env node
// Repo integrity guard — forged-merge + obfuscation signatures.
// Ported from xyzhub/orderly (via manifesto-js/manifesto) after the
// 2026-07-18 compromise (docs/security/2026-07-18-repo-compromise.md).
//
// Runs as the FIRST, fail-fast job in ci.yml (every other job `needs:` it) and
// unfiltered on every push via guard.yml. It re-implements the exact
// signatures of the incident: an `eval(atob(...))` loader appended after
// hundreds of spaces to config / script / CLI-entry files, plus a prepended
// `createRequire(import.meta.url)`, force-pushed as forged single-parent
// "Merge pull request" commits with the original author/date preserved.
//
// Detection is FIXED-STRING on raw bytes (no regex, no encoding tricks).
// It never imports or executes repo code.

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const errors = []

const SELF = 'scripts/ci/security-guard.mjs'
const isSkipped = f => f === SELF || f.startsWith('docs/security/')

// Literal fragments of the injected loader. Nothing legitimate in this repo
// contains them (verified against the clean tree on 2026-09-04).
const GLOBAL_SIGNATURES = [
  'eval("global.o=',
  '_$_7d9c',
  'createRequire(import.meta.url)',
]

// `atob(` is fine in browser/server code, but the files the loader targeted are
// evaluated at build / boot / publish time and have no honest reason to base64-
// decode at import. The patterns below cover the ten files hit on 2026-07-18:
// every nuxt.config / app.config, package scripts, the CLI entry, seeds.
const ATOB = 'atob('
const isConfigSurface = f =>
  /(^|\/)nuxt\.config\.[cm]?[tj]s$/.test(f)
  || /(^|\/)app\.config\.[cm]?[tj]s$/.test(f)
  || /(^|\/)seed[^/]*\.[cm]?[tj]s$/.test(f)
  || /^packages\/[^/]+\/scripts\//.test(f)
  || /^packages\/cli\/src\/cli\.[cm]?[tj]s$/.test(f)
  || f.startsWith('scripts/')

let files
try {
  files = execFileSync('git', ['ls-files', '-z'], { maxBuffer: 64 * 1024 * 1024 })
    .toString('utf8')
    .split('\0')
    .filter(Boolean)
} catch (err) {
  console.error('✗ security-guard: git ls-files failed')
  console.error(String(err))
  process.exit(1)
}

for (const file of files) {
  if (isSkipped(file)) continue
  let buf
  try {
    buf = readFileSync(file)
  } catch {
    continue // tracked path absent from the working tree (mid-rebase); nothing to scan
  }
  for (const sig of GLOBAL_SIGNATURES) {
    if (buf.includes(sig)) errors.push(`obfuscation signature ${JSON.stringify(sig)} in tracked file: ${file}`)
  }
  if (isConfigSurface(file) && buf.includes(ATOB)) {
    errors.push(`base64 decode (${JSON.stringify(ATOB)}) in config/seed/entry file: ${file} — loader-staging signature`)
  }
}

// Forged-merge check: genuine GitHub PR merges are 2-parent. The 2026-07-18
// 2026-07-18 forgeries on manifesto-js/manifesto wore that subject with ONE parent.
try {
  const subject = execFileSync('git', ['log', '-1', '--format=%s'], { encoding: 'utf8' }).trim()
  const parents = execFileSync('git', ['log', '-1', '--format=%P'], { encoding: 'utf8' }).trim().split(/\s+/).filter(Boolean)
  if (subject.startsWith('Merge pull request') && parents.length < 2) {
    errors.push(`forged-merge signature: HEAD subject ${JSON.stringify(subject)} claims a PR merge but has ${parents.length} parent(s); genuine merges have 2`)
  }
} catch (err) {
  console.error('✗ security-guard: could not inspect HEAD')
  console.error(String(err))
  process.exit(1)
}

if (errors.length) {
  console.error('✗ security-guard: repository integrity check FAILED')
  for (const e of errors) console.error(`  ✗ ${e}`)
  console.error('\nFix the tree or, for a genuine false positive, the signature list in scripts/ci/security-guard.mjs. Do not weaken the gate to get green.')
  process.exit(1)
}

console.log(`✓ security-guard clean (${files.length} tracked files scanned; forged-merge check passed)`)
