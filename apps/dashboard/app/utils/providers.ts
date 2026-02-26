// ---------------------------------------------------------------------------
// Provider Registry — static metadata for known Commerce.js providers
// ---------------------------------------------------------------------------

export type ProviderType = 'payment' | 'delivery' | 'notification' | 'analytics'

export interface ProviderField {
  key: string
  label: string
  type: 'text' | 'password' | 'url'
  required: boolean
  placeholder?: string
  hint?: string
}

export interface ProviderMeta {
  id: string
  name: string
  type: ProviderType
  icon: string
  description: string
  package: string
  fields: ProviderField[]
  docsUrl?: string
}

/** All known Commerce.js providers */
export const providerRegistry: ProviderMeta[] = [
  // ---- Payment ----
  {
    id: 'tap',
    name: 'Tap Payments',
    type: 'payment',
    icon: 'i-lucide-credit-card',
    description: 'Accept card payments via Tap — redirect-based, PCI-free checkout supporting tokenized cards and 3D Secure.',
    package: '@commercejs/payment-tap',
    docsUrl: 'https://developers.tap.company',
    fields: [
      { key: 'secretKey', label: 'Secret Key', type: 'password', required: true, placeholder: 'sk_live_...' },
      { key: 'publishableKey', label: 'Publishable Key', type: 'text', required: true, placeholder: 'pk_live_...' },
    ],
  },

  // ---- Delivery ----
  {
    id: 'armada',
    name: 'Armada Delivery',
    type: 'delivery',
    icon: 'i-lucide-truck',
    description: 'Last-mile delivery with real-time driver tracking, COD support, and automatic fee estimation.',
    package: '@commercejs/delivery-armada',
    docsUrl: 'https://docs.armadadelivery.com',
    fields: [
      { key: 'appId', label: 'App ID', type: 'text', required: true, placeholder: 'From Integrator Studio → App Credentials', hint: 'Used during merchant install handshake' },
      { key: 'appSecret', label: 'App Secret', type: 'password', required: true, placeholder: 'From Integrator Studio → App Credentials', hint: 'Used to sign the HMAC challenge' },
      { key: 'accessToken', label: 'Access Token', type: 'password', required: false, placeholder: 'Auto-populated after merchant installs', hint: 'Received via OAuth callback — do not edit manually' },
    ],
  },
  {
    id: 'parcel',
    name: 'Parcel',
    type: 'delivery',
    icon: 'i-lucide-package-check',
    description: 'Multi-region parcel delivery with OAuth2 authentication, rate estimation, and webhook tracking.',
    package: '@commercejs/delivery-parcel',
    docsUrl: 'https://docs.parcel.sa',
    fields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true, placeholder: 'Your OAuth2 client ID' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true, placeholder: 'Your OAuth2 client secret' },
    ],
  },

  // ---- Notification ----
  {
    id: 'resend',
    name: 'Resend',
    type: 'notification',
    icon: 'i-lucide-send',
    description: 'Transactional email notifications powered by Resend — order confirmations, shipping updates, and receipts.',
    package: '@commercejs/notification-resend',
    docsUrl: 'https://resend.com/docs',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 're_...' },
      { key: 'fromEmail', label: 'From Email', type: 'text', required: true, placeholder: 'orders@yourdomain.com' },
      { key: 'fromName', label: 'From Name', type: 'text', required: false, placeholder: 'My Store' },
    ],
  },
  {
    id: 'smtp',
    name: 'SMTP',
    type: 'notification',
    icon: 'i-lucide-mail',
    description: 'Send transactional emails via any SMTP server — Gmail, SendGrid, Mailgun, or your own.',
    package: '@commercejs/notification-smtp',
    fields: [
      { key: 'host', label: 'SMTP Host', type: 'text', required: true, placeholder: 'smtp.gmail.com' },
      { key: 'port', label: 'Port', type: 'text', required: true, placeholder: '587' },
      { key: 'user', label: 'Username', type: 'text', required: true, placeholder: 'you@gmail.com' },
      { key: 'pass', label: 'Password', type: 'password', required: true, placeholder: '••••••••' },
      { key: 'from', label: 'From Address', type: 'text', required: true, placeholder: 'orders@yourdomain.com' },
    ],
  },

  // ---- Analytics ----
  {
    id: 'ga4',
    name: 'Google Analytics 4',
    type: 'analytics',
    icon: 'i-lucide-bar-chart-2',
    description: 'Automatic GA4 event tracking for page views, add to cart, purchases, and eCommerce funnels.',
    package: '@commercejs/analytics-ga',
    docsUrl: 'https://developers.google.com/analytics',
    fields: [
      { key: 'measurementId', label: 'Measurement ID', type: 'text', required: true, placeholder: 'G-XXXXXXXXXX' },
    ],
  },
]

/** Get a provider by ID */
export function getProviderById(id: string): ProviderMeta | undefined {
  return providerRegistry.find(p => p.id === id)
}

/** Filter providers by type */
export function getProvidersByType(type: ProviderType): ProviderMeta[] {
  return providerRegistry.filter(p => p.type === type)
}

/** Provider type labels and colors */
export const providerTypeConfig: Record<ProviderType, { label: string; color: string; icon: string }> = {
  payment: { label: 'Payment', color: 'violet', icon: 'i-lucide-credit-card' },
  delivery: { label: 'Delivery', color: 'emerald', icon: 'i-lucide-truck' },
  notification: { label: 'Notification', color: 'amber', icon: 'i-lucide-bell' },
  analytics: { label: 'Analytics', color: 'sky', icon: 'i-lucide-bar-chart-2' },
}
