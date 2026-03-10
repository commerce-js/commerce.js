/**
 * Post-build script: add .js extensions to relative imports in dist/
 *
 * @nuxt/module-builder@0.8.x compiles .ts → .js but strips file extensions
 * from relative import specifiers (e.g. `from "../utils/handler"` instead
 * of `from "../utils/handler.js"`).
 *
 * ESM resolution in Cloudflare Workers requires explicit .js extensions
 * for relative imports to resolve correctly. This script patches all
 * compiled .js files under dist/runtime/server/ to add the missing
 * extensions.
 *
 * This matches the behavior of @nuxt/module-builder@1.x which does this
 * automatically (see nuxt-auth-utils for reference).
 */

import { readdir, readFile, writeFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const distDir = join(__dirname, '..', 'dist', 'runtime', 'server')

/**
 * Add .js extension to relative import/export specifiers.
 * Matches: from "./foo"  →  from "./foo.js"
 * Matches: from "../utils/handler"  →  from "../utils/handler.js"
 * Skips: already has .js extension, npm packages, #imports
 */
function addJsExtensions(code) {
  return code.replace(
    /(from\s+["'])(\.\.?\/[^"']+)(["'])/g,
    (match, prefix, specifier, suffix) => {
      // Skip if already has an extension
      if (/\.\w+$/.test(specifier)) return match
      return `${prefix}${specifier}.js${suffix}`
    }
  )
}

async function processDir(dir) {
  let count = 0
  const entries = await readdir(dir)

  for (const entry of entries) {
    const fullPath = join(dir, entry)
    const s = await stat(fullPath)

    if (s.isDirectory()) {
      count += await processDir(fullPath)
      continue
    }

    if (!entry.endsWith('.js')) continue

    const content = await readFile(fullPath, 'utf-8')
    const fixed = addJsExtensions(content)

    if (fixed !== content) {
      await writeFile(fullPath, fixed, 'utf-8')
      count++
    }
  }

  return count
}

try {
  const count = await processDir(distDir)
  console.log(`✅ Fixed .js extensions in ${count} files`)
} catch (err) {
  // dist/runtime/server may not exist if build had no server files
  if (err.code === 'ENOENT') {
    console.log('⏭️  No server files to fix')
  } else {
    throw err
  }
}
