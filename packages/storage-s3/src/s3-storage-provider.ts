// ---------------------------------------------------------------------------
// S3StorageProvider — S3-compatible object storage (AWS S3, R2, Spaces, MinIO)
// ---------------------------------------------------------------------------
//
// Wraps the S3 REST API via aws4fetch and normalizes operations into
// Commerce.js's unified StorageProvider interface.
//
// Works with any S3-compatible service by changing the endpoint URL.
// ---------------------------------------------------------------------------

import { AwsClient } from 'aws4fetch'
import type {
  StorageProvider,
  StorageUploadResult,
  UploadInput,
  PresignedUrlOptions,
  PresignedUrlResult,
} from '@commercejs/types'

import type { S3StorageConfig } from './types.js'

/**
 * S3-compatible storage provider — works with AWS S3, Cloudflare R2,
 * DigitalOcean Spaces, MinIO, and any S3-protocol service.
 *
 * @example
 * ```ts
 * // AWS S3
 * const storage = new S3StorageProvider({
 *   endpoint: 'https://s3.us-east-1.amazonaws.com',
 *   region: 'us-east-1',
 *   bucket: 'my-store',
 *   accessKeyId: 'AKIA...',
 *   secretAccessKey: '...',
 *   publicUrl: 'https://cdn.example.com',
 * })
 *
 * // Cloudflare R2
 * const r2 = new S3StorageProvider({
 *   endpoint: 'https://<account>.r2.cloudflarestorage.com',
 *   region: 'auto',
 *   bucket: 'assets',
 *   accessKeyId: '...',
 *   secretAccessKey: '...',
 * })
 *
 * const result = await storage.upload({
 *   filename: 'hero.jpg',
 *   mimeType: 'image/jpeg',
 *   content: imageBytes,
 *   directory: 'products',
 * })
 * // → { key: 'products/a1b2c3-hero.jpg', url: 'https://cdn.example.com/products/a1b2c3-hero.jpg' }
 * ```
 */
export class S3StorageProvider implements StorageProvider {
  readonly id = 's3'
  readonly name = 'Amazon S3'

  private client: AwsClient
  private config: S3StorageConfig

  constructor(config: S3StorageConfig) {
    this.config = config
    this.client = new AwsClient({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      service: 's3',
      region: config.region,
    })
  }

  // ---- upload ---------------------------------------------------------------

  async upload(input: UploadInput): Promise<StorageUploadResult> {
    const key = this.buildKey(input.filename, input.directory)
    const url = this.getObjectUrl(key)

    const response = await this.client.fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': input.mimeType,
      },
      body: input.content as unknown as BodyInit,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`S3 upload error (${response.status}): ${errorText}`)
    }

    return {
      key,
      url: this.getUrl(key),
    }
  }

  // ---- delete ---------------------------------------------------------------

  async delete(key: string): Promise<void> {
    const url = this.getObjectUrl(this.prefixKey(key))

    const response = await this.client.fetch(url, {
      method: 'DELETE',
    })

    if (!response.ok && response.status !== 404) {
      const errorText = await response.text()
      throw new Error(`S3 delete error (${response.status}): ${errorText}`)
    }
  }

  // ---- getUrl ---------------------------------------------------------------

  getUrl(key: string): string {
    const fullKey = this.prefixKey(key)

    if (this.config.publicUrl) {
      const base = this.config.publicUrl.replace(/\/+$/, '')
      return `${base}/${fullKey}`
    }

    return this.getObjectUrl(fullKey)
  }

  // ---- getPresignedUploadUrl ------------------------------------------------

  async getPresignedUploadUrl(
    key: string,
    options: PresignedUrlOptions = {},
  ): Promise<PresignedUrlResult> {
    const fullKey = this.prefixKey(key)
    const expiresIn = options.expiresIn ?? 3600
    const url = this.getObjectUrl(fullKey)

    const headers: Record<string, string> = {}
    if (options.contentType) {
      headers['Content-Type'] = options.contentType
    }

    const signed = await this.client.sign(url, {
      method: 'PUT',
      headers,
      aws: { signQuery: true },
    })

    // Append X-Amz-Expires to the signed URL
    const signedUrl = new URL(signed.url)
    signedUrl.searchParams.set('X-Amz-Expires', String(expiresIn))

    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

    return {
      url: signedUrl.toString(),
      expiresAt,
      method: 'PUT',
      headers: options.contentType ? { 'Content-Type': options.contentType } : undefined,
    }
  }

  // ---- getPresignedDownloadUrl ----------------------------------------------

  async getPresignedDownloadUrl(
    key: string,
    options: PresignedUrlOptions = {},
  ): Promise<PresignedUrlResult> {
    const fullKey = this.prefixKey(key)
    const expiresIn = options.expiresIn ?? 3600
    const url = this.getObjectUrl(fullKey)

    const signed = await this.client.sign(url, {
      method: 'GET',
      aws: { signQuery: true },
    })

    const signedUrl = new URL(signed.url)
    signedUrl.searchParams.set('X-Amz-Expires', String(expiresIn))

    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

    return {
      url: signedUrl.toString(),
      expiresAt,
      method: 'GET',
    }
  }

  // ---- Private helpers ------------------------------------------------------

  /** Build a unique storage key from filename + optional directory */
  private buildKey(filename: string, directory?: string): string {
    const uuid = crypto.randomUUID().slice(0, 8)
    const ext = filename.includes('.') ? filename.slice(filename.lastIndexOf('.')) : ''
    const baseName = filename.includes('.')
      ? filename.slice(0, filename.lastIndexOf('.')).replace(/[^a-zA-Z0-9-_]/g, '-')
      : filename.replace(/[^a-zA-Z0-9-_]/g, '-')
    const uniqueName = `${baseName}-${uuid}${ext}`

    const parts: string[] = []
    if (this.config.prefix) parts.push(this.config.prefix.replace(/\/+$/, ''))
    if (directory) parts.push(directory.replace(/\/+$/, ''))
    parts.push(uniqueName)

    return parts.join('/')
  }

  /** Prepend the global prefix to a key (for operations on existing keys) */
  private prefixKey(key: string): string {
    if (!this.config.prefix) return key
    const prefix = this.config.prefix.replace(/\/+$/, '')
    // Avoid double-prefixing
    if (key.startsWith(`${prefix}/`)) return key
    return `${prefix}/${key}`
  }

  /** Get the full S3 object URL for a key */
  private getObjectUrl(key: string): string {
    const endpoint = this.config.endpoint.replace(/\/+$/, '')
    const bucket = this.config.bucket

    if (this.config.forcePathStyle) {
      // Path-style: https://endpoint/bucket/key
      return `${endpoint}/${bucket}/${key}`
    }

    // Virtual-hosted-style: https://bucket.endpoint/key
    // Parse the endpoint to insert bucket as subdomain
    const url = new URL(endpoint)
    url.hostname = `${bucket}.${url.hostname}`
    return `${url.origin}/${key}`
  }
}
