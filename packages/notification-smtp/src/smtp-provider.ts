// ---------------------------------------------------------------------------
// SMTP Notification Provider for CommerceJS
// ---------------------------------------------------------------------------

import { createTransport, type Transporter, type TransportOptions } from 'nodemailer'
import type SMTPTransport from 'nodemailer/lib/smtp-transport/index.js'
import type {
  NotificationProvider,
  NotificationChannel,
  NotificationMessage,
  NotificationResult,
} from '@commercejs/types'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface SmtpProviderConfig {
  /** SMTP host (e.g. "smtp.gmail.com", "mail.example.com") */
  host: string

  /** SMTP port (typically 465 for SSL, 587 for TLS, 25 for unencrypted) */
  port: number

  /**
   * Use TLS/STARTTLS.
   * - `true`: use STARTTLS upgrade (port 587)
   * - `false`: no encryption (port 25)
   * For implicit TLS (port 465), set `secure: true` instead.
   * @default false
   */
  secure?: boolean

  /** SMTP authentication credentials */
  auth?: {
    user: string
    pass: string
  }

  /** Default sender address (e.g. "Store <noreply@example.com>") */
  from: string

  /**
   * Optional reply-to address.
   * Useful for routing customer replies to support.
   */
  replyTo?: string

  /**
   * Optional custom nodemailer transporter instance.
   * If provided, host/port/auth are ignored.
   * Useful for testing or advanced configurations.
   */
  transporter?: Transporter

  /**
   * Connection timeout in milliseconds.
   * @default 10000
   */
  connectionTimeout?: number

  /**
   * Socket timeout in milliseconds.
   * @default 10000
   */
  socketTimeout?: number

  /**
   * Enable connection pooling for high-throughput sending.
   * @default false
   */
  pool?: boolean

  /**
   * Maximum simultaneous connections when pooling is enabled.
   * @default 5
   */
  maxConnections?: number
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/**
 * Create an SMTP-backed notification provider for email delivery.
 *
 * @example
 * ```ts
 * import { createSmtpProvider } from '@commercejs/notification-smtp'
 *
 * const smtp = createSmtpProvider({
 *   host: 'smtp.gmail.com',
 *   port: 587,
 *   secure: false,
 *   auth: { user: 'you@gmail.com', pass: 'app-password' },
 *   from: 'My Store <noreply@mystore.com>',
 * })
 *
 * // Register in createCommerce()
 * const commerce = createCommerce({
 *   adapter,
 *   notifications: { smtp },
 *   notificationRules: [
 *     {
 *       event: 'order.created',
 *       channel: 'email',
 *       provider: 'smtp',
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
export function createSmtpProvider(config: SmtpProviderConfig): NotificationProvider {
  let transport: Transporter | null = config.transporter ?? null

  function getTransport(): Transporter {
    if (transport) return transport

    const options: SMTPTransport.Options = {
      host: config.host,
      port: config.port,
      secure: config.secure ?? false,
      auth: config.auth,
      connectionTimeout: config.connectionTimeout ?? 10_000,
      socketTimeout: config.socketTimeout ?? 10_000,
    }

    transport = createTransport(options)
    return transport
  }

  return {
    id: 'smtp',
    name: 'SMTP',
    channels: ['email'] as NotificationChannel[],

    async send(
      channel: NotificationChannel,
      message: NotificationMessage,
    ): Promise<NotificationResult> {
      if (channel !== 'email') {
        return {
          success: false,
          error: `SMTP only supports the "email" channel, got "${channel}"`,
        }
      }

      if (!message.to) {
        return {
          success: false,
          error: 'Missing "to" field in notification message',
        }
      }

      try {
        const mailer = getTransport()

        const mailOptions: Record<string, unknown> = {
          from: config.from,
          to: message.to,
          subject: message.subject ?? '(No subject)',
        }

        if (message.html) mailOptions.html = message.html
        if (message.text) mailOptions.text = message.text
        if (config.replyTo) mailOptions.replyTo = config.replyTo

        const info = await mailer.sendMail(mailOptions)

        return {
          success: true,
          messageId: info.messageId,
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
