// ---------------------------------------------------------------------------
// Notification Provider — pluggable notifications for commerce events
// ---------------------------------------------------------------------------

/**
 * Channels through which notifications can be delivered.
 */
export type NotificationChannel =
  | 'email'
  | 'sms'
  | 'push_web'
  | 'push_mobile'
  | 'whatsapp'
  | 'telegram'

/**
 * A notification message to be sent through a provider.
 */
export interface NotificationMessage {
  /** Target recipient (email address, phone number, device token, etc.) */
  to: string

  /** Notification subject/title */
  subject?: string

  /** Template identifier for the provider */
  template?: string

  /** Template variables to interpolate */
  data?: Record<string, unknown>

  /** Fallback plain-text content if no template is used */
  text?: string

  /** Fallback HTML content if no template is used */
  html?: string
}

/**
 * Result of sending a notification.
 */
export interface NotificationResult {
  /** Whether the send was successful */
  success: boolean

  /** Provider-specific message ID */
  messageId?: string

  /** Error message if unsuccessful */
  error?: string
}

/**
 * NotificationProvider — the interface for pluggable notification services.
 *
 * Providers implement this interface to deliver notifications through
 * one or more channels (email, SMS, push, WhatsApp, etc.).
 *
 * @example
 * ```ts
 * const resend: NotificationProvider = {
 *   id: 'resend',
 *   channels: ['email'],
 *   send: async (channel, message) => {
 *     const result = await resend.emails.send({
 *       from: 'store@example.com',
 *       to: message.to,
 *       subject: message.subject,
 *       html: message.html,
 *     })
 *     return { success: true, messageId: result.id }
 *   },
 * }
 * ```
 */
export interface NotificationProvider {
  /** Unique provider identifier */
  readonly id: string

  /** Human-readable name */
  readonly name: string

  /** Channels this provider supports */
  readonly channels: NotificationChannel[]

  /** Send a notification through the specified channel */
  send(channel: NotificationChannel, message: NotificationMessage): Promise<NotificationResult>
}

/**
 * A notification rule maps a commerce event to a notification action.
 *
 * When the specified event fires, the system sends a notification
 * through the configured channel using the template/data builder.
 *
 * @example
 * ```ts
 * const rules: NotificationRule[] = [
 *   {
 *     event: 'order.created',
 *     channel: 'email',
 *     provider: 'resend',
 *     template: 'order_confirmation',
 *     buildMessage: (payload) => ({
 *       to: payload.order.customer.email,
 *       subject: `Order #${payload.order.id} confirmed`,
 *       data: { order: payload.order },
 *     }),
 *   },
 * ]
 * ```
 */
export interface NotificationRule {
  /** The commerce event that triggers this notification */
  event: string

  /** Which channel to use */
  channel: NotificationChannel

  /** Which provider to route through (must be registered) */
  provider: string

  /** Template identifier */
  template?: string

  /**
   * Build the notification message from the event payload.
   *
   * Called when the event fires. Return the message to send,
   * or `null` to skip this notification for this particular event.
   */
  buildMessage: (payload: unknown) => NotificationMessage | null
}
