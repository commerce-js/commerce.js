// ---------------------------------------------------------------------------
// Resend Notification Provider for CommerceJS
// ---------------------------------------------------------------------------

import type { Resend } from 'resend'
import type {
  NotificationProvider,
  NotificationChannel,
  NotificationMessage,
  NotificationResult,
} from '@commercejs/types'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface ResendProviderConfig {
  /** Resend API key */
  apiKey: string

  /** Default sender address (e.g. "Store <noreply@example.com>") */
  from: string

  /**
   * Optional reply-to address.
   * Useful for routing customer replies to support.
   */
  replyTo?: string

  /**
   * Optional custom Resend client instance.
   * If provided, `apiKey` is ignored and this client is used directly.
   * Useful for testing or when sharing a client across providers.
   */
  client?: Resend
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/**
 * Create a Resend-backed notification provider for email delivery.
 *
 * @example
 * ```ts
 * import { createResendProvider } from '@commercejs/notification-resend'
 *
 * const resend = createResendProvider({
 *   apiKey: 're_...',
 *   from: 'My Store <noreply@mystore.com>',
 * })
 *
 * // Register in createCommerce()
 * const commerce = createCommerce({
 *   adapter,
 *   notifications: { resend },
 *   notificationRules: [
 *     {
 *       event: 'order.created',
 *       channel: 'email',
 *       provider: 'resend',
 *       template: 'order_confirmation',
 *       buildMessage: (payload) => ({
 *         to: payload.order.customer.email,
 *         subject: `Order confirmed`,
 *         data: { order: payload.order },
 *       }),
 *     },
 *   ],
 * })
 * ```
 */
export function createResendProvider(config: ResendProviderConfig): NotificationProvider {
  // Lazily initialize the Resend client
  let client: Resend | null = config.client ?? null

  async function getClient(): Promise<Resend> {
    if (client) return client
    // Dynamic import to avoid bundling Resend when using a custom client
    const { Resend } = await import('resend')
    client = new Resend(config.apiKey)
    return client
  }

  return {
    id: 'resend',
    name: 'Resend',
    channels: ['email'] as NotificationChannel[],

    async send(
      channel: NotificationChannel,
      message: NotificationMessage,
    ): Promise<NotificationResult> {
      if (channel !== 'email') {
        return {
          success: false,
          error: `Resend only supports the "email" channel, got "${channel}"`,
        }
      }

      if (!message.to) {
        return {
          success: false,
          error: 'Missing "to" field in notification message',
        }
      }

      try {
        const resend = await getClient()

        const payload: Record<string, unknown> = {
          from: config.from,
          to: message.to,
          subject: message.subject ?? '(No subject)',
        }
        if (message.html) payload.html = message.html
        if (message.text) payload.text = message.text
        if (config.replyTo) payload.replyTo = config.replyTo
        if (message.template) {
          payload.headers = { 'X-Template-Id': message.template }
        }

        const result = await resend.emails.send(payload as any)

        if (result.error) {
          return {
            success: false,
            error: result.error.message,
          }
        }

        return {
          success: true,
          messageId: result.data?.id,
        }
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : String(err),
        }
      }
    },
  }
}
