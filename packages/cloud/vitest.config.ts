import { defineConfig } from 'vitest/config'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

// Manually load .env since dotenv/vite aren't direct deps
const envPath = resolve(__dirname, '.env')
if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const value = trimmed.slice(eqIdx + 1).trim()
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

export default defineConfig({
  test: {
    name: 'cloud',
    include: ['src/**/*.test.ts', '__tests__/**/*.test.ts'],
    environment: 'node',
    clearMocks: true,
    restoreMocks: true,
    testTimeout: 60_000, // Cloud API calls can be slow
  },
})
