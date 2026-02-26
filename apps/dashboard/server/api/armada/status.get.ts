// ---------------------------------------------------------------------------
// Armada Status Endpoint — check if Armada is configured and connected
// ---------------------------------------------------------------------------
// Returns the current Armada config status (without exposing secrets).

import { defineEventHandler } from 'h3'

export default defineEventHandler(async () => {
  const storage = useStorage('data')
  const config = await storage.getItem('armada:config') as Record<string, any> | null

  if (!config) {
    return {
      connected: false,
      merchant: null,
      installedAt: null,
    }
  }

  return {
    connected: true,
    merchant: {
      id: config.merchantId,
      name: config.merchantName,
      country: config.merchantCountry,
    },
    installedAt: config.installedAt,
    hasToken: !!config.accessToken,
  }
})
