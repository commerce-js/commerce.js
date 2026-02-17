# @commercejs/storage-s3

## 0.2.0

### Minor Changes

- [`3c539a5`](https://github.com/commerce-js/commerce.js/commit/3c539a51746d02d2643b25a5dbb041abc143928b) Thanks [@masterde](https://github.com/masterde)! - feat: add StorageProvider interface and S3-compatible storage provider

  - **@commercejs/types**: New `StorageProvider` interface with `upload`, `delete`, `getUrl`, `getPresignedUploadUrl`, and `getPresignedDownloadUrl` methods
  - **@commercejs/storage-s3**: New package — S3-compatible storage provider using `aws4fetch`, works with AWS S3, Cloudflare R2, DigitalOcean Spaces, and MinIO
  - **@commercejs/core**: Added `storage` config option and storage methods to `CommerceInstance`

### Patch Changes

- Updated dependencies [[`3c539a5`](https://github.com/commerce-js/commerce.js/commit/3c539a51746d02d2643b25a5dbb041abc143928b)]:
  - @commercejs/types@0.3.0
