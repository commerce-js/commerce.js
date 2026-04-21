// ---------------------------------------------------------------------------
// worker handleSendEmail — dispatch smoke tests
// ---------------------------------------------------------------------------
//
// Imports the live provider module and swaps the transport via the
// `transporter` escape hatch on createSmtpProvider (set via env — instead
// we reset the singleton + mock the provider's `send` at the module
// boundary).
// ---------------------------------------------------------------------------

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the email-provider singleton so handleSendEmail doesn't need real
// SMTP credentials in the test env.
const sendMock = vi.fn()
vi.mock('../server/utils/email-provider', () => ({
  getEmailProvider: () => ({ send: sendMock }),
  resetEmailProvider: () => {},
}))
// Worker-handlers references '@commercejs/platform' and './db' — stub both
// so the handler doesn't drag Prisma or the control-DB client into the
// test env.
vi.mock('@commercejs/platform', () => ({
  getPrismaClient: () => ({}),
  runWithDb: (_db: unknown, fn: () => unknown) => fn(),
}))
vi.mock('../server/utils/db', () => ({
  useDB: () => ({ merchant: { findUnique: async () => ({ databaseUrl: '' }) } }),
}))
vi.mock('../server/utils/merchant-provisioner', () => ({
  provisionMerchant: async () => ({ merchantId: '', neonProjectId: '', neonBranchId: '' }),
}))

// eslint-disable-next-line import/first
import { handleSendEmail } from '../server/utils/worker-handlers'

beforeEach(() => {
  sendMock.mockReset()
})

afterEach(() => {
  vi.clearAllMocks()
})

const baseData = {
  merchantId: 'm_1',
  to: 'alice@example.com',
  template: 'staff-invite',
  vars: {
    name: 'Alice',
    storeName: 'Acme Co',
    inviteUrl: 'https://acme.commercejs.cloud/admin/invite/tok',
    expiresAt: '2026-05-01T10:00:00.000Z',
    inviterName: 'Baker',
  },
}

describe('handleSendEmail — happy path', () => {
  it('renders the template and hands it to the provider', async () => {
    sendMock.mockResolvedValueOnce({ success: true, messageId: 'msg_1' })
    await handleSendEmail(baseData as any)
    expect(sendMock).toHaveBeenCalledTimes(1)
    const [channel, message] = sendMock.mock.calls[0]
    expect(channel).toBe('email')
    expect(message.to).toBe('alice@example.com')
    expect(message.subject).toContain('Acme Co')
    expect(message.html).toContain('Alice')
    expect(message.text).toContain('Alice')
    expect(message.template).toBe('staff-invite')
  })

  it('uses data.subject when provided as an override', async () => {
    sendMock.mockResolvedValueOnce({ success: true, messageId: 'msg_2' })
    await handleSendEmail({ ...baseData, subject: 'Custom subject' } as any)
    const [, message] = sendMock.mock.calls[0]
    expect(message.subject).toBe('Custom subject')
  })
})

describe('handleSendEmail — failure surfaces to BullMQ via throw', () => {
  it('throws when provider.send returns success=false', async () => {
    sendMock.mockResolvedValueOnce({ success: false, error: 'connection refused' })
    await expect(handleSendEmail(baseData as any)).rejects.toThrow(/connection refused/)
  })

  it('throws when template key is unknown', async () => {
    await expect(
      handleSendEmail({ ...baseData, template: 'does-not-exist' } as any),
    ).rejects.toThrow(/Unknown email template/i)
    expect(sendMock).not.toHaveBeenCalled()
  })
})
