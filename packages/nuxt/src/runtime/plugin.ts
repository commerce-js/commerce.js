import { defineNuxtPlugin } from '#imports'
import { consola } from 'consola'
import type { CommerceAdapter } from '@commercejs/types'

const logger = consola.withTag('@commercejs/nuxt')

/**
 * Plugin that provides the CommerceAdapter instance to the Nuxt app.
 *
 * **Architecture (Option A — Server-Only Adapter)**:
 * - On the **server**: The Nitro server plugin (`commerce-adapter.ts`)
 *   injects the real adapter into `event.context._commerceAdapter`.
 *   Server API routes access it via `useServerAdapter(event)`.
 *
 * - On the **client**: Composables use `useState` which persists SSR data
 *   across hydration. Client-side navigation re-fetches via the server
 *   API routes (e.g., `/api/_commerce/products`).
 *
 * Tokens never leave the server. The adapter is SSR-only.
 */
export default defineNuxtPlugin({
  name: 'commercejs',
  enforce: 'pre',
  async setup(nuxtApp) {
    // On the server, the Nitro plugin provides the real adapter.
    // On the client, $commerce is not available — composables use
    // useAsyncData/useState which hydrate from SSR data.
    if (import.meta.server) {
      // The adapter is injected by the Nitro server plugin into event.context.
      // Composables that use useAdapter() will work during SSR because the
      // Nitro plugin has already set up the adapter.
      const event = nuxtApp.ssrContext?.event
      if (event) {
        const adapter = (event.context as any)?._commerceAdapter as CommerceAdapter | undefined
        if (adapter) {
          nuxtApp.provide('commerce', adapter)
        } else {
          logger.warn(
            'No commerce adapter found in server context. ' +
            'Ensure the Nitro server plugin is registered.',
          )
        }
      }
    } else {
      // Client-side: adapter is not available directly.
      // Composables should use useAsyncData or $fetch to call server routes.
      logger.debug('CommerceJS running in client mode — using SSR-hydrated data.')
    }
  },
})
