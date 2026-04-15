/**
 * Subdomains that merchants may NOT use — reserved for platform infrastructure,
 * branding, or DNS / TLS mechanics.
 *
 * Enforced server-side in POST /api/merchants.
 * Imported on the client for instant UX validation in the new-merchant form.
 */
export const RESERVED_SUBDOMAINS: ReadonlySet<string> = new Set([
  // Platform UI
  'app',
  'cloud',        // Legacy dashboard hostname
  'admin',
  'dashboard',
  'console',
  'panel',
  'portal',
  'control',

  // Authentication / accounts
  'auth',
  'login',
  'logout',
  'signup',
  'register',
  'account',
  'accounts',
  'password',
  'reset',
  'verify',
  'sso',
  'oauth',

  // API / developer
  'api',
  'graphql',
  'webhook',
  'webhooks',
  'dev',
  'develop',
  'development',
  'staging',
  'stage',
  'test',
  'testing',
  'sandbox',
  'preview',
  'beta',
  'alpha',
  'demo',
  'lab',
  'labs',

  // Docs / support
  'docs',
  'documentation',
  'help',
  'support',
  'status',
  'feedback',
  'community',
  'forum',
  'forums',
  'kb',

  // Email infrastructure
  'mail',
  'email',
  'smtp',
  'imap',
  'pop',
  'mx',
  'bounce',
  'relay',

  // Marketing / brand
  'blog',
  'news',
  'press',
  'shop',       // Could confuse merchant storefronts
  'store',
  'market',
  'marketplace',
  'home',

  // Payments / billing (platform services)
  'checkout',
  'pay',
  'payment',
  'payments',
  'billing',
  'invoice',
  'invoices',
  'subscription',

  // CDN / assets
  'cdn',
  'assets',
  'static',
  'media',
  'img',
  'images',
  'files',
  'uploads',

  // Infrastructure / networking
  'ftp',
  'sftp',
  'ssh',
  'vpn',
  'proxy',
  'gateway',
  'edge',
  'lb',
  'ns',
  'ns1',
  'ns2',
  'dns',
  'ssl',
  'tls',
  'certs',
  'security',

  // Standard web subdomains
  'www',
  'web',
  'm',
  'mobile',

  // Brand protection
  'commercejs',
  'commerce',

  // Legal
  'legal',
  'privacy',
  'terms',
  'tos',
  'gdpr',

  // Monitoring / ops
  'monitor',
  'monitoring',
  'metrics',
  'logs',
  'telemetry',
  'trace',
  'health',
  'ping',

  // Catch-all short names that are ambiguous
  'root',
  'null',
  'undefined',
  'void',
  'default',
  'localhost',
  'local',
  'internal',
  'intranet',
  'private',
  'public',
  'global',
])

/**
 * Returns true when the subdomain is reserved and merchants cannot use it.
 */
export function isReservedSubdomain(subdomain: string): boolean {
  return RESERVED_SUBDOMAINS.has(subdomain.toLowerCase())
}
