import { describe, it, expect, vi, beforeEach } from 'vitest'
import { S3StorageProvider } from '../s3-storage-provider.js'
import type { S3StorageConfig } from '../types.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Base config for tests */
const BASE_CONFIG: S3StorageConfig = {
  endpoint: 'https://s3.us-east-1.amazonaws.com',
  region: 'us-east-1',
  bucket: 'test-bucket',
  accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
}

/**
 * Mock the aws4fetch AwsClient to avoid real crypto operations in tests.
 * We intercept the provider's client.fetch and client.sign calls.
 */
function mockProviderFetch(
  provider: S3StorageProvider,
  responseData: { ok: boolean; status: number; text: string } = { ok: true, status: 200, text: '' },
) {
  const mockFetch = vi.fn().mockResolvedValue({
    ok: responseData.ok,
    status: responseData.status,
    text: () => Promise.resolve(responseData.text),
  })

  // Replace the internal AwsClient's fetch method
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = (provider as any).client
  client.fetch = mockFetch

  return mockFetch
}

function mockProviderSign(
  provider: S3StorageProvider,
  signedUrl = 'https://test-bucket.s3.us-east-1.amazonaws.com/test-key?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Signature=abc123',
) {
  const mockSign = vi.fn().mockResolvedValue(new Request(signedUrl))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = (provider as any).client
  client.sign = mockSign

  return mockSign
}

// Mock crypto.randomUUID for predictable keys
vi.stubGlobal('crypto', {
  ...globalThis.crypto,
  randomUUID: () => 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('S3StorageProvider', () => {
  let provider: S3StorageProvider

  beforeEach(() => {
    provider = new S3StorageProvider(BASE_CONFIG)
  })

  // ---- Constructor -------------------------------------------------------

  describe('constructor', () => {
    it('sets id and name', () => {
      expect(provider.id).toBe('s3')
      expect(provider.name).toBe('Amazon S3')
    })
  })

  // ---- upload ------------------------------------------------------------

  describe('upload()', () => {
    it('uploads a file and returns key + URL', async () => {
      const fetchMock = mockProviderFetch(provider)

      const result = await provider.upload({
        filename: 'hero.jpg',
        mimeType: 'image/jpeg',
        content: new Uint8Array([0xff, 0xd8, 0xff]),
      })

      expect(result.key).toBe('hero-a1b2c3d4.jpg')
      expect(result.url).toContain('hero-a1b2c3d4.jpg')

      // Verify PUT was called
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('hero-a1b2c3d4.jpg'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'image/jpeg',
          }),
        }),
      )
    })

    it('applies directory prefix', async () => {
      mockProviderFetch(provider)

      const result = await provider.upload({
        filename: 'hero.jpg',
        mimeType: 'image/jpeg',
        content: new Uint8Array([1, 2, 3]),
        directory: 'products',
      })

      expect(result.key).toBe('products/hero-a1b2c3d4.jpg')
    })

    it('returns CDN URL when publicUrl is configured', async () => {
      const cdnProvider = new S3StorageProvider({
        ...BASE_CONFIG,
        publicUrl: 'https://cdn.example.com',
      })
      mockProviderFetch(cdnProvider)

      const result = await cdnProvider.upload({
        filename: 'hero.jpg',
        mimeType: 'image/jpeg',
        content: new Uint8Array([1, 2, 3]),
        directory: 'products',
      })

      expect(result.url).toBe('https://cdn.example.com/products/hero-a1b2c3d4.jpg')
    })

    it('applies global prefix from config', async () => {
      const prefixProvider = new S3StorageProvider({
        ...BASE_CONFIG,
        prefix: 'uploads',
      })
      mockProviderFetch(prefixProvider)

      const result = await prefixProvider.upload({
        filename: 'hero.jpg',
        mimeType: 'image/jpeg',
        content: new Uint8Array([1, 2, 3]),
      })

      expect(result.key).toBe('uploads/hero-a1b2c3d4.jpg')
    })

    it('handles filenames without extension', async () => {
      mockProviderFetch(provider)

      const result = await provider.upload({
        filename: 'README',
        mimeType: 'text/plain',
        content: new Uint8Array([1, 2, 3]),
      })

      expect(result.key).toBe('README-a1b2c3d4')
    })

    it('sanitizes special characters in filenames', async () => {
      mockProviderFetch(provider)

      const result = await provider.upload({
        filename: 'my file (1).jpg',
        mimeType: 'image/jpeg',
        content: new Uint8Array([1, 2, 3]),
      })

      expect(result.key).toBe('my-file--1--a1b2c3d4.jpg')
    })

    it('throws on S3 API error', async () => {
      mockProviderFetch(provider, {
        ok: false,
        status: 403,
        text: 'Access Denied',
      })

      await expect(
        provider.upload({
          filename: 'hero.jpg',
          mimeType: 'image/jpeg',
          content: new Uint8Array([1, 2, 3]),
        }),
      ).rejects.toThrow('S3 upload error (403): Access Denied')
    })
  })

  // ---- delete ------------------------------------------------------------

  describe('delete()', () => {
    it('sends DELETE request for the key', async () => {
      const fetchMock = mockProviderFetch(provider)

      await provider.delete('products/hero-a1b2c3d4.jpg')

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('products/hero-a1b2c3d4.jpg'),
        expect.objectContaining({ method: 'DELETE' }),
      )
    })

    it('does not throw on 404 (already deleted)', async () => {
      mockProviderFetch(provider, { ok: false, status: 404, text: 'Not Found' })

      // Should not throw
      await expect(provider.delete('nonexistent.jpg')).resolves.toBeUndefined()
    })

    it('throws on other errors', async () => {
      mockProviderFetch(provider, { ok: false, status: 500, text: 'Internal Error' })

      await expect(provider.delete('file.jpg')).rejects.toThrow('S3 delete error (500)')
    })
  })

  // ---- getUrl ------------------------------------------------------------

  describe('getUrl()', () => {
    it('returns S3 URL when no CDN configured', () => {
      const url = provider.getUrl('products/hero.jpg')
      expect(url).toContain('products/hero.jpg')
      expect(url).toContain('test-bucket')
    })

    it('returns CDN URL when publicUrl is configured', () => {
      const cdnProvider = new S3StorageProvider({
        ...BASE_CONFIG,
        publicUrl: 'https://cdn.example.com',
      })

      const url = cdnProvider.getUrl('products/hero.jpg')
      expect(url).toBe('https://cdn.example.com/products/hero.jpg')
    })

    it('strips trailing slash from publicUrl', () => {
      const cdnProvider = new S3StorageProvider({
        ...BASE_CONFIG,
        publicUrl: 'https://cdn.example.com/',
      })

      const url = cdnProvider.getUrl('products/hero.jpg')
      expect(url).toBe('https://cdn.example.com/products/hero.jpg')
    })
  })

  // ---- getPresignedUploadUrl ---------------------------------------------

  describe('getPresignedUploadUrl()', () => {
    it('returns a presigned PUT URL', async () => {
      mockProviderSign(provider)

      const result = await provider.getPresignedUploadUrl('products/hero.jpg', {
        contentType: 'image/jpeg',
        expiresIn: 600,
      })

      expect(result.method).toBe('PUT')
      expect(result.url).toContain('X-Amz-Expires=600')
      expect(result.headers).toEqual({ 'Content-Type': 'image/jpeg' })
      expect(result.expiresAt).toBeTruthy()
    })

    it('defaults to 3600s expiration', async () => {
      mockProviderSign(provider)

      const result = await provider.getPresignedUploadUrl('file.txt')

      expect(result.url).toContain('X-Amz-Expires=3600')
    })

    it('omits headers when no contentType specified', async () => {
      mockProviderSign(provider)

      const result = await provider.getPresignedUploadUrl('file.txt')

      expect(result.headers).toBeUndefined()
    })
  })

  // ---- getPresignedDownloadUrl -------------------------------------------

  describe('getPresignedDownloadUrl()', () => {
    it('returns a presigned GET URL', async () => {
      mockProviderSign(provider)

      const result = await provider.getPresignedDownloadUrl('invoices/inv-001.pdf', {
        expiresIn: 900,
      })

      expect(result.method).toBe('GET')
      expect(result.url).toContain('X-Amz-Expires=900')
      expect(result.expiresAt).toBeTruthy()
    })
  })

  // ---- URL construction --------------------------------------------------

  describe('URL construction', () => {
    it('uses virtual-hosted-style by default', () => {
      const url = provider.getUrl('test.jpg')
      expect(url).toBe('https://test-bucket.s3.us-east-1.amazonaws.com/test.jpg')
    })

    it('uses path-style when forcePathStyle is true', () => {
      const pathProvider = new S3StorageProvider({
        ...BASE_CONFIG,
        endpoint: 'http://localhost:9000',
        forcePathStyle: true,
      })

      const url = pathProvider.getUrl('test.jpg')
      expect(url).toBe('http://localhost:9000/test-bucket/test.jpg')
    })
  })
})
