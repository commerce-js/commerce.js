import { defineConfig } from 'vitest/config'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

// Manually load .env — no dotenv dependency needed
const envPath = resolve(import.meta.dirname ?? __dirname, '.env')
if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    let value = trimmed.slice(eqIdx + 1).trim()
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    exclude: ['src/__tests__/platform.prisma.test.ts'],
    environment: 'node',
    globals: true,
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
})
