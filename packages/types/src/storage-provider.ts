// ---------------------------------------------------------------------------
// StorageProvider — Pluggable object storage for the native platform
// ---------------------------------------------------------------------------
//
// Provides a universal interface for storing and serving files (product images,
// invoices, exports). Required by the native Commerce.js platform; external
// adapters (Salla, Medusa) manage their own media and don't use this.
// ---------------------------------------------------------------------------

/** Result returned after uploading a file */
export interface StorageUploadResult {
  /** Storage key (e.g., 'products/abc123.jpg') — used for delete, presigned ops */
  key: string
  /** Public or CDN URL for the uploaded file */
  url: string
}

/** Input for uploading a file */
export interface UploadInput {
  /** File name (e.g., 'product-hero.jpg') */
  filename: string
  /** MIME type (e.g., 'image/jpeg') */
  mimeType: string
  /** File content as a Uint8Array */
  content: Uint8Array
  /** Optional path prefix (e.g., 'products', 'invoices') */
  directory?: string
  /** Access level — 'public' files get a direct URL, 'private' require presigned */
  access?: 'public' | 'private'
}

/** Options for generating presigned URLs */
export interface PresignedUrlOptions {
  /** Expiration in seconds (default: 3600 = 1 hour) */
  expiresIn?: number
  /** Content type constraint (for upload URLs) */
  contentType?: string
  /** Maximum content length in bytes (for upload URLs) */
  maxContentLength?: number
}

/** Presigned URL result */
export interface PresignedUrlResult {
  /** The presigned URL */
  url: string
  /** Expiration timestamp (ISO 8601) */
  expiresAt: string
  /** HTTP method to use ('GET' for download, 'PUT' for upload) */
  method: 'GET' | 'PUT'
  /** Required headers the client must send (e.g., Content-Type for PUT) */
  headers?: Record<string, string>
}

/**
 * Universal storage provider interface for object/file storage.
 *
 * @example
 * ```ts
 * import { S3StorageProvider } from '@commercejs/storage-s3'
 *
 * const storage = new S3StorageProvider({
 *   endpoint: 'https://s3.us-east-1.amazonaws.com',
 *   region: 'us-east-1',
 *   bucket: 'my-store-assets',
 *   accessKeyId: '...',
 *   secretAccessKey: '...',
 *   publicUrl: 'https://cdn.example.com',
 * })
 *
 * // Server-side upload
 * const result = await storage.upload({
 *   filename: 'hero.jpg',
 *   mimeType: 'image/jpeg',
 *   content: imageBuffer,
 *   directory: 'products',
 * })
 * // result.url → 'https://cdn.example.com/products/a1b2c3-hero.jpg'
 *
 * // Client-side direct upload (presigned URL)
 * const { url, headers } = await storage.getPresignedUploadUrl(
 *   'products/hero.jpg',
 *   { contentType: 'image/jpeg' },
 * )
 * // Browser: await fetch(url, { method: 'PUT', headers, body: file })
 * ```
 */
export interface StorageProvider {
  /** Provider identifier (e.g., 's3') */
  readonly id: string
  /** Human-readable name (e.g., 'Amazon S3') */
  readonly name: string

  /** Upload a file and return its storage key + public URL */
  upload(input: UploadInput): Promise<StorageUploadResult>

  /** Delete a file by its storage key */
  delete(key: string): Promise<void>

  /** Get the public/CDN URL for a stored file */
  getUrl(key: string): string

  /** Generate a presigned URL for direct browser upload (PUT) */
  getPresignedUploadUrl(key: string, options?: PresignedUrlOptions): Promise<PresignedUrlResult>

  /** Generate a presigned URL for private file download (GET) */
  getPresignedDownloadUrl(key: string, options?: PresignedUrlOptions): Promise<PresignedUrlResult>
}
