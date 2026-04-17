---
'@commercejs/storage-s3': patch
---

Fix `getPresignedUploadUrl()` and `getPresignedDownloadUrl()` — the `X-Amz-Expires` query parameter was being set on the URL **after** calling `aws4fetch`'s `sign()`, which invalidated the resulting signature. `aws4fetch` defaults `X-Amz-Expires` to `86400` internally when missing at sign time, so the signature was always computed against `86400` while the URL carried whatever `expiresIn` the caller passed. S3 / S3-compatible services (AWS S3, Fly Tigris, R2, etc.) responded with `403 SignatureDoesNotMatch` on PUT.

Fix: set `X-Amz-Expires` on the URL **before** passing it to `sign()`, so aws4fetch signs the correct value.

Smoke-verified against Fly Tigris — a 900-second presigned PUT now accepts the upload and returns 200.
