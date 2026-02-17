# @commercejs/storage-s3

S3-compatible storage provider for [Commerce.js](https://github.com/commerce-js/commerce.js) — works with **AWS S3**, **Cloudflare R2**, **DigitalOcean Spaces**, **MinIO**, and any S3-protocol service.

## Install

```bash
pnpm add @commercejs/storage-s3
```

## Quick Start

```ts
import { createCommerce } from '@commercejs/core'
import { S3StorageProvider } from '@commercejs/storage-s3'

const storage = new S3StorageProvider({
  endpoint: 'https://s3.us-east-1.amazonaws.com',
  region: 'us-east-1',
  bucket: 'my-store-assets',
  accessKeyId: process.env.S3_ACCESS_KEY_ID!,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  publicUrl: 'https://cdn.example.com', // optional CDN
})

const commerce = createCommerce({
  adapter: myAdapter,
  storage,
})
```

## Usage

### Server-side upload

```ts
const result = await commerce.uploadFile({
  filename: 'hero.jpg',
  mimeType: 'image/jpeg',
  content: imageBytes, // Uint8Array
  directory: 'products',
})
// → { key: 'products/hero-a1b2c3d4.jpg', url: 'https://cdn.example.com/products/hero-a1b2c3d4.jpg' }
```

### Client-side direct upload (presigned URL)

```ts
// Server: generate a presigned upload URL
const { url, headers } = await commerce.getPresignedUploadUrl('products/hero.jpg', {
  contentType: 'image/jpeg',
  expiresIn: 600, // 10 minutes
})

// Client (browser): upload directly to S3
await fetch(url, { method: 'PUT', headers, body: file })
```

### Delete

```ts
await commerce.deleteFile('products/hero-a1b2c3d4.jpg')
```

### Get URL

```ts
const url = commerce.getFileUrl('products/hero-a1b2c3d4.jpg')
// → 'https://cdn.example.com/products/hero-a1b2c3d4.jpg'
```

### Private file download (presigned)

```ts
const { url } = await commerce.getPresignedDownloadUrl('invoices/inv-001.pdf', {
  expiresIn: 900, // 15 minutes
})
```

## S3-Compatible Services

```ts
// AWS S3
new S3StorageProvider({ endpoint: 'https://s3.us-east-1.amazonaws.com', region: 'us-east-1', ... })

// Cloudflare R2
new S3StorageProvider({ endpoint: 'https://<account>.r2.cloudflarestorage.com', region: 'auto', ... })

// DigitalOcean Spaces
new S3StorageProvider({ endpoint: 'https://nyc3.digitaloceanspaces.com', region: 'nyc3', ... })

// MinIO (self-hosted)
new S3StorageProvider({ endpoint: 'http://localhost:9000', region: 'us-east-1', forcePathStyle: true, ... })

// Supabase S3
new S3StorageProvider({ endpoint: 'https://<project>.supabase.co/storage/v1/s3', region: 'auto', ... })
```

## Configuration

| Option | Type | Required | Description |
|---|---|---|---|
| `endpoint` | `string` | ✅ | S3-compatible endpoint URL |
| `region` | `string` | ✅ | Region (`'us-east-1'`, `'auto'` for R2) |
| `bucket` | `string` | ✅ | Bucket name |
| `accessKeyId` | `string` | ✅ | Access key ID |
| `secretAccessKey` | `string` | ✅ | Secret access key |
| `publicUrl` | `string` | | CDN base URL for public files |
| `prefix` | `string` | | Global key prefix (e.g., `'uploads/'`) |
| `forcePathStyle` | `boolean` | | Path-style URLs (required for MinIO) |

## License

MIT
