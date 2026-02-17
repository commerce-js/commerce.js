// ---------------------------------------------------------------------------
// S3 Storage — config types
// ---------------------------------------------------------------------------

/** Configuration for S3StorageProvider */
export interface S3StorageConfig {
  /** S3-compatible endpoint URL (e.g., 'https://s3.us-east-1.amazonaws.com') */
  endpoint: string
  /** S3 region (e.g., 'us-east-1', 'auto' for Cloudflare R2) */
  region: string
  /** Bucket name */
  bucket: string
  /** AWS / S3-compatible access key ID */
  accessKeyId: string
  /** AWS / S3-compatible secret access key */
  secretAccessKey: string
  /** Public URL base for CDN (e.g., 'https://cdn.example.com') */
  publicUrl?: string
  /** Global key prefix for all objects (e.g., 'uploads/') */
  prefix?: string
  /** Use path-style addressing (required for MinIO, optional for others) */
  forcePathStyle?: boolean
}
