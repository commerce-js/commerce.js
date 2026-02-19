# Prisma + Cloudflare Pages Deployment

## Problem
Prisma 7.4 WASM module fails to bundle correctly for Cloudflare Workers via Nuxt/Nitro.

## Current Setup
- **Prisma**: `^7.4.0` with `@prisma/adapter-neon`
- **Database**: Neon PostgreSQL (serverless)
- **Deploy target**: Cloudflare Pages (Nuxt SSR)
- **Schema**: Multi-file (`prisma.config.ts` → `src/database/prisma/schema/`)

## Solutions Tried

### 1. ❌ `runtime = "cloudflare"` + `compilerBuild = "small"` (removed)
- Produced empty `runtimeDataModel` — no model types generated
- 123 TypeScript errors (`Property 'product' does not exist on type 'PrismaClient'`)
- **Root cause**: Was running `prisma generate --schema=file.prisma` (single file), bypassing multi-file schema

### 2. ✅ Fixed `prisma generate` command (no `--schema` flag)
- Running `prisma generate` without `--schema` flag reads `prisma.config.ts` correctly
- Loads all 14 `.prisma` files, generates all 27 model files
- **This was the actual fix** for the missing types

### 3. ✅ `runtime = "cloudflare"` restored (commit `ee819bd`)
- With correct generate command, `runtime = "cloudflare"` produces full model types
- Build passes clean

### 4. ✅ `compilerBuild = "fast"` added (commit `6bade35`)
- Better query compilation performance on Cloudflare Workers
- Clean generate after `rm -rf generated/` — all 27 models present
- Build passes

### 5. ✅ `unwasm` Vite plugin added (commit `980ac10`)
- `nitro.experimental.wasm = true` handles build-time bundling
- `unwasm` Vite plugin needed for dev server `.wasm?module` imports
- Added to `@commercejs/nuxt` module

### 6. ✅ Cloudflare config simplified (commits `3b26d04`, `7a00856`)
- Removed all Cloudflare-specific config from module (route exclusions, `nodejs_compat`, `compatibilityDate`)
- Nuxt's `cloudflare-pages` preset handles these automatically
- Storefront only sets `preset: 'cloudflare-pages'`

## Current State (commit `7a00856`)

**schema.prisma generator:**
```prisma
generator client {
  provider               = "prisma-client"
  output                 = "../generated"
  moduleFormat           = "esm"
  generatedFileExtension = "ts"
  runtime                = "cloudflare"
  compilerBuild          = "fast"
}
```

**@commercejs/nuxt module sets:**
- `nitro.experimental.wasm = true`
- `unwasm` Vite plugin (`esmImport: true`)

**Storefront nuxt.config.ts:**
- `nitro.preset = 'cloudflare-pages'`

## Fallback Options (if deploy fails)

### A. Remove `runtime = "cloudflare"` and `compilerBuild = "fast"`
- Prisma Neon docs don't show `runtime = "cloudflare"` — rely on `@prisma/adapter-neon` for edge compatibility
- Try plain generator with just `provider`, `output`, `moduleFormat`, `generatedFileExtension`

### B. Try `runtime = "workerd"` instead of `"cloudflare"`
- Some Prisma examples use `workerd` (V8's actual runtime name)
- May have different WASM bundling behavior

### C. Remove `unwasm` Vite plugin
- If `nitro.experimental.wasm` already handles it, `unwasm` may double-process and corrupt WASM
- Known issue: `unwasm` fails to parse Prisma's `.wasm-base64.js` named exports

### D. Externalize Prisma from Nitro bundling
```ts
nitro: { externals: { inline: ['@prisma/client'] } }
```

### E. Downgrade to Prisma 6.19
- Last resort — Prisma 7 + Cloudflare Workers has documented issues
- Some users report `CompileError: WebAssembly.Module(): Wasm code generation disallowed by embedder`

### F. Use Prisma Accelerate
- Prisma's managed edge proxy — eliminates WASM bundling entirely
- Adds latency but guaranteed to work on any edge runtime

## Key Docs References
- [Prisma Cloudflare Deploy Guide](https://www.prisma.io/docs/orm/prisma-client/deployment/edge/deploy-to-cloudflare)
- [Nuxt Cloudflare Deploy](https://nuxt.com/deploy/cloudflare)
- `dotenv-cli` is **not needed** — only for CLI commands with `.dev.vars` files
- `prisma.config.ts` already has `import 'dotenv/config'` for local `.env` loading
