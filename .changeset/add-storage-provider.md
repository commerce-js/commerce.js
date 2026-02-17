---
"@commercejs/storage-s3": minor
"@commercejs/types": minor
"@commercejs/core": minor
---

feat: add StorageProvider interface and S3-compatible storage provider

- **@commercejs/types**: New `StorageProvider` interface with `upload`, `delete`, `getUrl`, `getPresignedUploadUrl`, and `getPresignedDownloadUrl` methods
- **@commercejs/storage-s3**: New package — S3-compatible storage provider using `aws4fetch`, works with AWS S3, Cloudflare R2, DigitalOcean Spaces, and MinIO
- **@commercejs/core**: Added `storage` config option and storage methods to `CommerceInstance`
