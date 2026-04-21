// ---------------------------------------------------------------------------
// Job handlers — pure functions, importable from tests
// ---------------------------------------------------------------------------
//
// Lives separately from `worker.ts` so the handlers can be unit-tested
// without triggering the BullMQ Worker bootstrap at module import time
// (which would try to connect to Redis and hang in CI).
//
// The worker entry imports these and wires them into a single `dispatch`.
// ---------------------------------------------------------------------------

import { createHash, createHmac } from 'node:crypto'
import { getPrismaClient, runWithDb } from '@commercejs/platform'
import { useDB } from './db'
import { provisionMerchant } from './merchant-provisioner'
import { getEmailProvider } from './email-provider'
import { renderEmail } from '../emails/_render'
import type {
  DispatchWebhookJob,
  ProvisionStoreJob,
  SendEmailJob,
} from './queue'

export async function handleProvisionStore(data: ProvisionStoreJob['data']): Promise<void> {
  const result = await provisionMerchant(data.merchantId)
  console.log(
    '[worker] provision-store OK merchant=%s neonProjectId=%s neonBranchId=%s',
    result.merchantId,
    result.neonProjectId,
    result.neonBranchId,
  )
}

export async function handleSendEmail(data: SendEmailJob['data']): Promise<void> {
  // Templates are global — no merchant DB binding needed. `merchantId` is
  // carried for audit / URL-building in the enqueuer, not for scoping here.
  const rendered = renderEmail(data.template, data.vars ?? {})
  const subject = data.subject ?? rendered.subject

  const provider = getEmailProvider()
  const result = await provider.send('email', {
    to: data.to,
    subject,
    html: rendered.html,
    text: rendered.text,
    template: data.template,
  })

  if (!result.success) {
    // Throwing triggers BullMQ's retry (attempts: 5, backoff: exponential@5s).
    // A permanent failure after all attempts lands in the dead-letter zone.
    throw new Error(
      `send-email ${data.template} → ${data.to} failed: ${result.error}`,
    )
  }

  console.log(
    '[worker] send-email OK merchant=%s to=%s template=%s messageId=%s',
    data.merchantId,
    data.to,
    data.template,
    result.messageId ?? '(none)',
  )
}

export async function handleDispatchWebhook(data: DispatchWebhookJob['data']): Promise<void> {
  const prisma = getPrismaClient(await resolveMerchantDatabaseUrl(data.merchantId))

  await runWithDb(prisma, async () => {
    const body = JSON.stringify(data.payload)
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'x-commerce-event': data.event,
      'x-commerce-delivery-id': createHash('sha256')
        .update(`${data.merchantId}:${data.event}:${Date.now()}`)
        .digest('hex')
        .slice(0, 32),
    }
    if (data.secret) {
      const sig = createHmac('sha256', data.secret).update(body).digest('hex')
      headers['x-commerce-signature'] = `sha256=${sig}`
    }

    const res = await fetch(data.url, { method: 'POST', headers, body })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(
        `webhook ${data.event} → ${data.url} responded ${res.status} ${res.statusText}: ${text.slice(0, 200)}`,
      )
    }
  })
}

async function resolveMerchantDatabaseUrl(merchantId: string): Promise<string> {
  const merchant = await useDB().merchant.findUnique({
    where: { id: merchantId },
    select: { databaseUrl: true },
  })
  if (!merchant?.databaseUrl) {
    throw new Error(`merchant ${merchantId} has no database_url — still provisioning?`)
  }
  return merchant.databaseUrl
}
