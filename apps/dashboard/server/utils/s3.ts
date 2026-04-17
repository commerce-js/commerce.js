// ---------------------------------------------------------------------------
// S3 storage config — reads env vars directly from process.env and returns
// an S3StorageConfig for `new S3StorageProvider(...)`.
// ---------------------------------------------------------------------------
//
// Single shared bucket, partitioned per-merchant by key prefix
// (`merchants/${merchant.id}/…`). The prefix is always computed at the
// call site from `event.context.merchant.id` — never from client input —
// so the config itself is stateless across merchants and carries no
// `prefix`. See /api/admin/uploads/presign.post.ts for the actual key
// composition.
//
// v1 backend is Fly Tigris — `fly storage create` auto-injects creds
// as AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_ENDPOINT_URL_S3 /
// AWS_REGION / BUCKET_NAME. We read those Fly-native names directly
// (same pattern as NEON_CONTROL_DB_URL in utils/db.ts), avoiding a
// duplicate `fly secrets set` step. Any S3-compatible provider works
// by setting the same env vars manually.
// ---------------------------------------------------------------------------

import process from 'node:process'
import { createError } from 'h3'
import type { S3StorageConfig } from '@commercejs/storage-s3'

export interface S3AppConfig extends S3StorageConfig {
  /** Optional CDN base — if set, public object URLs resolve from here. */
  publicUrl?: string
}

/**
 * Read the app's S3 config from process.env. Throws 500 if required vars
 * are missing — surfaces a clear error at request time instead of
 * producing a malformed presigned URL.
 */
export function getS3Config(): S3AppConfig {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3 || ''
  const region = process.env.AWS_REGION || ''
  const bucket = process.env.BUCKET_NAME || ''
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || ''
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || ''
  const publicUrl = process.env.AWS_S3_PUBLIC_URL || ''
  const forcePathStyleRaw = process.env.AWS_S3_FORCE_PATH_STYLE || ''

  const missing: string[] = []
  if (!endpoint) missing.push('AWS_ENDPOINT_URL_S3')
  if (!region) missing.push('AWS_REGION')
  if (!bucket) missing.push('BUCKET_NAME')
  if (!accessKeyId) missing.push('AWS_ACCESS_KEY_ID')
  if (!secretAccessKey) missing.push('AWS_SECRET_ACCESS_KEY')

  if (missing.length > 0) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Storage not configured',
      message: `Missing env vars: ${missing.join(', ')}`,
    })
  }

  const forcePathStyle = /^(1|true|yes)$/i.test(forcePathStyleRaw)

  return {
    endpoint,
    region,
    bucket,
    accessKeyId,
    secretAccessKey,
    publicUrl: publicUrl || undefined,
    forcePathStyle,
  }
}

/**
 * Compose the public URL for an object key given the app's S3 config.
 * Mirrors the logic in S3StorageProvider.getUrl() but decoupled from
 * provider instance state so we can return `publicUrl` in the presign
 * response without re-instantiating.
 */
export function publicUrlForKey(cfg: S3AppConfig, key: string): string {
  if (cfg.publicUrl) {
    return `${cfg.publicUrl.replace(/\/+$/, '')}/${key}`
  }

  const endpoint = cfg.endpoint.replace(/\/+$/, '')
  if (cfg.forcePathStyle) {
    return `${endpoint}/${cfg.bucket}/${key}`
  }
  const url = new URL(endpoint)
  url.hostname = `${cfg.bucket}.${url.hostname}`
  return `${url.origin}/${key}`
}
