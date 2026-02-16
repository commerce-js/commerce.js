import { describe, it, expect, vi } from 'vitest'
import { createResendProvider } from '../resend-provider.js'

// ---------------------------------------------------------------------------
// Mock Resend client
// ---------------------------------------------------------------------------

function createMockResendClient(overrides?: {
  sendResult?: { data?: { id: string }; error?: { message: string } }
}) {
  const sendResult = overrides?.sendResult ?? { data: { id: 'msg_123' } }

  return {
    emails: {
      send: vi.fn().mockResolvedValue(sendResult),
    },
  } as any
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ResendNotificationProvider', () => {
  const baseConfig = {
    apiKey: 're_test_key',
    from: 'Store <noreply@example.com>',
  }

  it('has correct metadata', () => {
    const provider = createResendProvider(baseConfig)
    expect(provider.id).toBe('resend')
    expect(provider.name).toBe('Resend')
    expect(provider.channels).toEqual(['email'])
  })

  it('sends an email via Resend client', async () => {
    const mockClient = createMockResendClient()
    const provider = createResendProvider({ ...baseConfig, client: mockClient })

    const result = await provider.send('email', {
      to: 'customer@example.com',
      subject: 'Order confirmed',
      html: '<h1>Thanks!</h1>',
    })

    expect(result).toEqual({ success: true, messageId: 'msg_123' })
    expect(mockClient.emails.send).toHaveBeenCalledOnce()
    expect(mockClient.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Store <noreply@example.com>',
        to: 'customer@example.com',
        subject: 'Order confirmed',
        html: '<h1>Thanks!</h1>',
      }),
    )
  })

  it('includes reply-to when configured', async () => {
    const mockClient = createMockResendClient()
    const provider = createResendProvider({
      ...baseConfig,
      replyTo: 'support@example.com',
      client: mockClient,
    })

    await provider.send('email', {
      to: 'customer@example.com',
      subject: 'Hello',
      text: 'Hi there',
    })

    expect(mockClient.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({
        replyTo: 'support@example.com',
      }),
    )
  })

  it('includes template header when template is specified', async () => {
    const mockClient = createMockResendClient()
    const provider = createResendProvider({ ...baseConfig, client: mockClient })

    await provider.send('email', {
      to: 'customer@example.com',
      subject: 'Order confirmed',
      template: 'order_confirmation',
      data: { orderId: '123' },
    })

    expect(mockClient.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: { 'X-Template-Id': 'order_confirmation' },
      }),
    )
  })

  it('rejects non-email channels', async () => {
    const provider = createResendProvider(baseConfig)

    const result = await provider.send('sms', {
      to: '+1234567890',
      text: 'Hello',
    })

    expect(result).toEqual({
      success: false,
      error: 'Resend only supports the "email" channel, got "sms"',
    })
  })

  it('returns error when "to" is missing', async () => {
    const mockClient = createMockResendClient()
    const provider = createResendProvider({ ...baseConfig, client: mockClient })

    const result = await provider.send('email', {
      to: '',
      subject: 'Test',
    })

    expect(result).toEqual({
      success: false,
      error: 'Missing "to" field in notification message',
    })
    expect(mockClient.emails.send).not.toHaveBeenCalled()
  })

  it('handles Resend API errors gracefully', async () => {
    const mockClient = createMockResendClient({
      sendResult: { error: { message: 'Invalid API key' } },
    })
    const provider = createResendProvider({ ...baseConfig, client: mockClient })

    const result = await provider.send('email', {
      to: 'customer@example.com',
      subject: 'Test',
    })

    expect(result).toEqual({
      success: false,
      error: 'Invalid API key',
    })
  })

  it('catches thrown exceptions', async () => {
    const mockClient = {
      emails: {
        send: vi.fn().mockRejectedValue(new Error('Network timeout')),
      },
    } as any

    const provider = createResendProvider({ ...baseConfig, client: mockClient })

    const result = await provider.send('email', {
      to: 'customer@example.com',
      subject: 'Test',
    })

    expect(result).toEqual({
      success: false,
      error: 'Network timeout',
    })
  })

  it('uses default subject when none provided', async () => {
    const mockClient = createMockResendClient()
    const provider = createResendProvider({ ...baseConfig, client: mockClient })

    await provider.send('email', {
      to: 'customer@example.com',
      html: '<p>Hello</p>',
    })

    expect(mockClient.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: '(No subject)',
      }),
    )
  })
})
