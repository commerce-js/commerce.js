#!/usr/bin/env node
/**
 * Post-build script: patches unwasm-generated WASM wrappers for Cloudflare Workers.
 *
 * unwasm wraps .wasm imports with WebAssembly.instantiate(), which is disallowed
 * on Cloudflare Workers. This script:
 *
 * 1. Finds and DELETES corrupted .wasm files (JS glue code that unwasm renamed
 *    to .wasm — identifiable by missing WASM magic bytes 00 61 73 6d).
 * 2. Patches remaining .mjs wrappers that use WebAssembly.instantiate() to use
 *    a direct import() returning a WebAssembly.Module (Cloudflare's native behavior).
 */
import { readdir, readFile, writeFile, unlink } from 'node:fs/promises'
import { join, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = join(__dirname, '../dist/_worker.js')
const chunksDir = join(distDir, 'chunks')
const wasmDir = join(distDir, 'wasm')

// WASM magic bytes: \0asm
const WASM_MAGIC = Buffer.from([0x00, 0x61, 0x73, 0x6d])

let patchedWrappers = 0
let deletedWasm = 0
const deletedWasmFiles = new Set()

// Step 1: Delete corrupted .wasm files (JS glue code with wrong extension)
async function cleanCorruptedWasm(dir) {
  let entries
  try { entries = await readdir(dir, { withFileTypes: true }) }
  catch { return }

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      await cleanCorruptedWasm(fullPath)
    } else if (entry.name.endsWith('.wasm')) {
      const buf = Buffer.alloc(4)
      const fd = await import('node:fs').then(fs =>
        fs.promises.open(fullPath, 'r')
      )
      try {
        await fd.read(buf, 0, 4, 0)
      } finally {
        await fd.close()
      }

      if (!buf.equals(WASM_MAGIC)) {
        await unlink(fullPath)
        deletedWasmFiles.add(fullPath)
        deletedWasm++
        console.log(`  ✘ Deleted corrupted .wasm: ${relative(distDir, fullPath)}`)
      }
    }
  }
}

// Step 2: Patch .mjs wrappers that use WebAssembly.instantiate()
async function patchWrappers(dir) {
  let entries
  try { entries = await readdir(dir, { withFileTypes: true }) }
  catch { return }

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      await patchWrappers(fullPath)
    } else if (entry.name.endsWith('.mjs')) {
      const content = await readFile(fullPath, 'utf-8')
      if (content.includes('WebAssembly') && content.includes('.wasm')) {
        const match = content.match(/import\(["']([^"']+\.wasm)["']\)/)
        if (match) {
          const wasmPath = match[1]

          // Resolve the referenced .wasm file to check if it was deleted
          const resolvedWasm = join(dirname(fullPath), wasmPath)
          if (deletedWasmFiles.has(resolvedWasm)) {
            // This wrapper references a deleted corrupted file — remove it
            await unlink(fullPath)
            console.log(`  ✘ Deleted orphaned wrapper: ${relative(distDir, fullPath)}`)
            continue
          }

          // Patch: replace WebAssembly.instantiate() wrapper with direct import
          const replacement = `const _mod = await import("${wasmPath}").then(r => r.default || r);\nexport default _mod;\n`
          await writeFile(fullPath, replacement)
          patchedWrappers++
          console.log(`  ✔ Patched: ${relative(distDir, fullPath)}`)
        }
      }
    }
  }
}

console.log('Patching WASM wrappers for Cloudflare Workers...')
console.log('')

console.log('Step 1: Cleaning corrupted .wasm files...')
await cleanCorruptedWasm(wasmDir)
console.log(`  Deleted ${deletedWasm} corrupted file(s).`)

console.log('')
console.log('Step 2: Patching .mjs wrappers...')
await patchWrappers(chunksDir)
console.log(`  Patched ${patchedWrappers} wrapper(s).`)

console.log('')
console.log(`Done. Deleted ${deletedWasm} corrupted .wasm file(s), patched ${patchedWrappers} wrapper(s).`)
