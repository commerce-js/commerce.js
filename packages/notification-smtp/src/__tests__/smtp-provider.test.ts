import { describe, it, expect, vi } from 'vitest'
import { createSmtpProvider } from '../smtp-provider.js'

// ---------------------------------------------------------------------------
// Mock nodemailer transporter
// ---------------------------------------------------------------------------

function createMockTransporter(overrides?: {
  sendResult?: { messageId?: string }
  shouldThrow?: Error
}) {
  const sendMail = overrides?.shouldThrow
    ? vi.fn().mockRejectedValue(overrides.shouldThrow)
    : vi.fn().mockResolvedValue({
        messageId: overrides?.sendResult?.messageId ?? '<msg-001@smtp.example.com>',
      })

  return { sendMail } as any
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SmtpNotificationProvider', () => {
  const baseConfig = {
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    auth: { user: 'test@example.com', pass: 'password' },
    from: 'Store <noreply@example.com>',
  }

  it('has correct metadata', () => {
    const provider = createSmtpProvider(baseConfig)
    expect(provider.id).toBe('smtp')
    expect(provider.name).toBe('SMTP')
    expect(provider.channels).toEqual(['email'])
  })

  it('sends an email via SMTP transporter', async () => {
    const mockTransporter = createMockTransporter()
    const provider = createSmtpProvider({ ...baseConfig, transporter: mockTransporter })

    const result = await provider.send('email', {
      to: 'customer@example.com',
      subject: 'Order confirmed',
      html: '<h1>Thanks!</h1>',
    })

    expect(result).toEqual({
      success: true,
      messageId: '<msg-001@smtp.example.com>',
    })
    expect(mockTransporter.sendMail).toHaveBeenCalledOnce()
    expect(mockTransporter.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Store <noreply@example.com>',
        to: 'customer@example.com',
        subject: 'Order confirmed',
        html: '<h1>Thanks!</h1>',
      }),
    )
  })

  it('sends plain text emails', async () => {
    const mockTransporter = createMockTransporter()
    const provider = createSmtpProvider({ ...baseConfig, transporter: mockTransporter })

    const result = await provider.send('email', {
      to: 'customer@example.com',
      subject: 'Order update',
      text: 'Your order has shipped.',
    })

    expect(result.success).toBe(true)
    expect(mockTransporter.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'Your order has shipped.',
      }),
    )
  })

  it('includes reply-to when configured', async () => {
    const mockTransporter = createMockTransporter()
    const provider = createSmtpProvider({
      ...baseConfig,
      replyTo: 'support@example.com',
      transporter: mockTransporter,
    })

    await provider.send('email', {
      to: 'customer@example.com',
      subject: 'Hello',
      text: 'Hi there',
    })

    expect(mockTransporter.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        replyTo: 'support@example.com',
      }),
    )
  })

  it('rejects non-email channels', async () => {
    const provider = createSmtpProvider(baseConfig)

    const result = await provider.send('sms', {
      to: '+1234567890',
      text: 'Hello',
    })

    expect(result).toEqual({
      success: false,
      error: 'SMTP only supports the "email" channel, got "sms"',
    })
  })

  it('returns error when "to" is missing', async () => {
    const mockTransporter = createMockTransporter()
    const provider = createSmtpProvider({ ...baseConfig, transporter: mockTransporter })

    const result = await provider.send('email', {
      to: '',
      subject: 'Test',
    })

    expect(result).toEqual({
      success: false,
      error: 'Missing "to" field in notification message',
    })
    expect(mockTransporter.sendMail).not.toHaveBeenCalled()
  })

  it('catches SMTP transport errors', async () => {
    const mockTransporter = createMockTransporter({
      shouldThrow: new Error('Connection refused'),
    })
    const provider = createSmtpProvider({ ...baseConfig, transporter: mockTransporter })

    const result = await provider.send('email', {
      to: 'customer@example.com',
      subject: 'Test',
    })

    expect(result).toEqual({
      success: false,
      error: 'Connection refused',
    })
  })

  it('catches authentication errors', async () => {
    const mockTransporter = createMockTransporter({
      shouldThrow: new Error('Invalid login: 535 Authentication failed'),
    })
    const provider = createSmtpProvider({ ...baseConfig, transporter: mockTransporter })

    const result = await provider.send('email', {
      to: 'customer@example.com',
      subject: 'Test',
    })

    expect(result).toEqual({
      success: false,
      error: 'Invalid login: 535 Authentication failed',
    })
  })

  it('uses default subject when none provided', async () => {
    const mockTransporter = createMockTransporter()
    const provider = createSmtpProvider({ ...baseConfig, transporter: mockTransporter })

    await provider.send('email', {
      to: 'customer@example.com',
      html: '<p>Hello</p>',
    })

    expect(mockTransporter.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: '(No subject)',
      }),
    )
  })

  it('sends both html and text in multipart', async () => {
    const mockTransporter = createMockTransporter()
    const provider = createSmtpProvider({ ...baseConfig, transporter: mockTransporter })

    await provider.send('email', {
      to: 'customer@example.com',
      subject: 'Multipart test',
      html: '<p>HTML version</p>',
      text: 'Plain text version',
    })

    expect(mockTransporter.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        html: '<p>HTML version</p>',
        text: 'Plain text version',
      }),
    )
  })

  it('returns custom messageId from SMTP response', async () => {
    const mockTransporter = createMockTransporter({
      sendResult: { messageId: '<custom-id-999@mail.example.com>' },
    })
    const provider = createSmtpProvider({ ...baseConfig, transporter: mockTransporter })

    const result = await provider.send('email', {
      to: 'customer@example.com',
      subject: 'Test',
      text: 'Hello',
    })

    expect(result).toEqual({
      success: true,
      messageId: '<custom-id-999@mail.example.com>',
    })
  })
})
