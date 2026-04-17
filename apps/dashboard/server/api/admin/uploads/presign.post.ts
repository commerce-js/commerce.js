// ---------------------------------------------------------------------------
// POST /api/admin/uploads/presign — issue a presigned PUT URL for S3
// ---------------------------------------------------------------------------
//
// The browser calls this, PUTs the file directly to S3, and then submits the
// resulting publicUrl as part of the product payload. No image body ever
// traverses Fly — we only mint a short-lived signature.
//
// Security:
//   • Caller must have a valid merchant session (requireMerchantSession
//     cross-checks session.merchantId against event.context.merchant.id).
//   • The object key is composed SERVER-SIDE from event.context.merchant.id
//     plus a fresh UUID. The client cannot influence the prefix, so a
//     compromised session cannot mint presigns into another merchant's
//     namespace.
//   • mimeType is validated against an allow-list; size is capped to 10 MB
//     at presign time and the signed URL carries the Content-Type header
//     the client must PUT with.
// ---------------------------------------------------------------------------

import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { S3StorageProvider } from '@commercejs/storage-s3'
import { requireMerchantSession } from '../../../utils/merchant-auth'
import { parseOrThrow } from '../../../utils/admin-validate'
import { getS3Config, publicUrlForKey } from '../../../utils/s3'

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024 // 10 MB

const ALLOWED_CONTEXTS = ['product', 'category', 'store-logo'] as const

const presignBodySchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  size: z.number().int().positive(),
  context: z.enum(ALLOWED_CONTEXTS).optional(),
})

const PRESIGN_EXPIRES_IN = 900 // 15 minutes

/** Strip path traversal and special chars; lowercase. */
function sanitizeFilename(raw: string): string {
  const basename = raw.split(/[/\\]/).pop() ?? raw
  const lower = basename.toLowerCase()
  const dot = lower.lastIndexOf('.')
  const stem = dot === -1 ? lower : lower.slice(0, dot)
  const ext = dot === -1 ? '' : lower.slice(dot)
  const safeStem = stem.replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '') || 'file'
  const safeExt = ext.replace(/[^a-z0-9.]/g, '')
  return `${safeStem}${safeExt}`
}

export default defineEventHandler(async (event) => {
  await requireMerchantSession(event)

  const merchant = event.context.merchant
  if (!merchant) {
    throw createError({ statusCode: 500, statusMessage: 'Tenant context missing' })
  }

  const body = await readBody(event)
  const input = parseOrThrow(presignBodySchema, body)

  if (!ALLOWED_MIME_TYPES.has(input.mimeType)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Unsupported media type',
      message: `mimeType must be one of: ${Array.from(ALLOWED_MIME_TYPES).join(', ')}`,
    })
  }

  if (input.size > MAX_UPLOAD_BYTES) {
    throw createError({
      statusCode: 413,
      statusMessage: 'Payload too large',
      message: `File exceeds ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB limit`,
    })
  }

  const cfg = getS3Config()

  const context = input.context ?? 'product'
  const bucketFolder = context === 'product' ? 'products' : context === 'category' ? 'categories' : 'store-logo'
  const safeName = sanitizeFilename(input.filename)
  // Prefix is computed server-side from the authenticated merchant's id —
  // never trust the client here.
  const key = `merchants/${merchant.id}/${bucketFolder}/${crypto.randomUUID()}/${safeName}`

  const storage = new S3StorageProvider({
    endpoint: cfg.endpoint,
    region: cfg.region,
    bucket: cfg.bucket,
    accessKeyId: cfg.accessKeyId,
    secretAccessKey: cfg.secretAccessKey,
    forcePathStyle: cfg.forcePathStyle,
    // Intentionally no `prefix` — our key already encodes the full path.
  })

  const signed = await storage.getPresignedUploadUrl(key, {
    expiresIn: PRESIGN_EXPIRES_IN,
    contentType: input.mimeType,
  })

  return {
    uploadUrl: signed.url,
    publicUrl: publicUrlForKey(cfg, key),
    key,
    expiresIn: PRESIGN_EXPIRES_IN,
  }
})
