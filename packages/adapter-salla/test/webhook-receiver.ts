#!/usr/bin/env npx tsx
// ---------------------------------------------------------------------------
// Salla OAuth Webhook Receiver
//
// Captures the access_token from app.store.authorize webhook event.
//
// Usage:
//   1. npx tsx packages/adapter-salla/test/webhook-receiver.ts
//   2. Expose port 3333 with ngrok:  ngrok http 3333
//   3. Set your Salla app's webhook URL to: https://YOUR_NGROK_URL/webhook
//   4. Install the app on a Salla store
//   5. The access_token will be saved to .env automatically
// ---------------------------------------------------------------------------

import { createServer } from 'node:http'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHmac } from 'node:crypto'

const PORT = Number(process.env.PORT ?? 3333)
const envPath = resolve(import.meta.dirname ?? __dirname, '..', '.env')

// Read client secret from .env
let clientSecret = ''
try {
  const envContent = readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.startsWith('SALLA_SECRET=')) {
      clientSecret = trimmed.slice('SALLA_SECRET='.length).trim()
    }
  }
} catch {}

function saveToken(accessToken: string, refreshToken?: string) {
  let envContent = ''
  try { envContent = readFileSync(envPath, 'utf-8') } catch {}

  // Update or add SALLA_TOKEN
  if (envContent.includes('SALLA_TOKEN=')) {
    envContent = envContent.replace(/SALLA_TOKEN=.*/, `SALLA_TOKEN=${accessToken}`)
  } else {
    envContent += `\nSALLA_TOKEN=${accessToken}`
  }

  // Update or add SALLA_REFRESH_TOKEN
  if (refreshToken) {
    if (envContent.includes('SALLA_REFRESH_TOKEN=')) {
      envContent = envContent.replace(/SALLA_REFRESH_TOKEN=.*/, `SALLA_REFRESH_TOKEN=${refreshToken}`)
    } else {
      envContent += `\nSALLA_REFRESH_TOKEN=${refreshToken}`
    }
  }

  writeFileSync(envPath, envContent.trim() + '\n')
}

const server = createServer((req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('Salla Webhook Receiver — POST /webhook to receive events')
    return
  }

  let body = ''
  req.on('data', (chunk) => { body += chunk })
  req.on('end', () => {
    try {
      const payload = JSON.parse(body)

      console.log(`\n📨 Received event: ${payload.event}`)
      console.log(`   Merchant: ${payload.merchant ?? 'unknown'}`)

      // Verify signature if we have the secret
      if (clientSecret) {
        const signature = req.headers['x-salla-signature'] as string
        if (signature) {
          const expected = createHmac('sha256', clientSecret).update(body).digest('hex')
          if (signature !== expected) {
            console.log('   ⚠️  Signature mismatch — be cautious')
          } else {
            console.log('   ✅ Signature verified')
          }
        }
      }

      if (payload.event === 'app.store.authorize') {
        const data = payload.data
        const accessToken = data?.access_token
        const refreshToken = data?.refresh_token

        if (accessToken) {
          console.log(`\n🔑 Access Token received!`)
          console.log(`   Token: ${accessToken.slice(0, 20)}...`)
          console.log(`   Expires: ${data?.expires ?? 'unknown'}`)

          saveToken(accessToken, refreshToken)
          console.log(`   ✅ Saved to .env`)
          console.log(`\n   Now run: pnpm --filter=@commercejs/adapter-salla exec tsx test/smoke.ts\n`)
        }
      } else {
        console.log(`   Payload: ${JSON.stringify(payload.data ?? {}).slice(0, 200)}`)
      }

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: true }))
    } catch (err) {
      console.error('❌ Parse error:', err)
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Invalid JSON' }))
    }
  })
})

server.listen(PORT, () => {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`  Salla Webhook Receiver`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`\n  Listening on http://localhost:${PORT}`)
  console.log(`\n  Next steps:`)
  console.log(`  1. Expose this with ngrok: ngrok http ${PORT}`)
  console.log(`  2. Set webhook URL in Salla Partners dashboard`)
  console.log(`  3. Install/reinstall the app on your store`)
  console.log(`  4. Token will be auto-saved to .env\n`)
})
