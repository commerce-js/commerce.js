// ---------------------------------------------------------------------------
// /api/projects/:id/domains — custom domain management
// ---------------------------------------------------------------------------
// GET    → list domains (from D1, synced with CF status)
// POST   → add domain (CF API + D1)
// DELETE → remove domain (CF API + D1)
// ---------------------------------------------------------------------------

import { defineEventHandler, readBody, getRouterParam } from 'h3'
import { eq } from 'drizzle-orm'
import { ofetch } from 'ofetch'
import { useDB, schema } from '../../../utils/db'

const CF_API_BASE = 'https://api.cloudflare.com/client/v4'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const projectId = getRouterParam(event, 'id')!

  // Load project to get CF Pages project name
  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId))
  if (!project) {
    throw createError({ statusCode: 404, message: 'Project not found' })
  }

  const config = useRuntimeConfig()
  const cfToken = config.cloudflareApiToken as string
  const cfAccountId = config.cloudflareAccountId as string
  const cfProjectName = project.cfPagesProjectName

  const cfHeaders = {
    'Authorization': `Bearer ${cfToken}`,
    'Content-Type': 'application/json',
  }

  // -------------------------------------------------------------------------
  // GET — list domains
  // -------------------------------------------------------------------------
  if (event.method === 'GET') {
    const localDomains = await db
      .select()
      .from(schema.domains)
      .where(eq(schema.domains.projectId, projectId))

    // If project has a CF Pages project, sync status from CF
    if (cfProjectName && cfToken && cfAccountId) {
      try {
        const cfResponse = await ofetch<{ result: any[] }>(
          `${CF_API_BASE}/accounts/${cfAccountId}/pages/projects/${cfProjectName}/domains`,
          { headers: cfHeaders },
        )
        const cfDomains = cfResponse.result || []

        // Update local status from CF
        for (const local of localDomains) {
          const cfDomain = cfDomains.find((d: any) => d.name === local.domain)
          if (cfDomain) {
            const newStatus = cfDomain.status === 'active' ? 'active' : 'pending'
            if (newStatus !== local.status || !local.cfDomainId) {
              await db
                .update(schema.domains)
                .set({ status: newStatus, cfDomainId: cfDomain.id })
                .where(eq(schema.domains.id, local.id))
              local.status = newStatus
              local.cfDomainId = cfDomain.id
            }
          }
        }
      }
      catch (error) {
        console.warn('[domains] Failed to sync CF status:', error)
      }
    }

    // Always include the default .pages.dev domain
    const defaultDomain = cfProjectName
      ? { id: '_default', domain: `${cfProjectName}.pages.dev`, status: 'active', isDefault: true }
      : null

    return {
      domains: [
        ...(defaultDomain ? [defaultDomain] : []),
        ...localDomains.map(d => ({ ...d, isDefault: false })),
      ],
      dnsTarget: cfProjectName ? `${cfProjectName}.pages.dev` : null,
    }
  }

  // -------------------------------------------------------------------------
  // POST — add domain
  // -------------------------------------------------------------------------
  if (event.method === 'POST') {
    const body = await readBody<{ domain: string }>(event)
    if (!body.domain) {
      throw createError({ statusCode: 400, message: 'domain is required' })
    }

    const domain = body.domain.toLowerCase().trim()

    // Validate domain format
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(domain)) {
      throw createError({ statusCode: 400, message: 'Invalid domain format' })
    }

    if (!cfProjectName) {
      throw createError({ statusCode: 400, message: 'Project has no CF Pages project. Deploy first.' })
    }

    // Add to Cloudflare
    let cfDomainId = ''
    let cfStatus = 'pending'

    try {
      const cfResult = await ofetch<{ result: any }>(
        `${CF_API_BASE}/accounts/${cfAccountId}/pages/projects/${cfProjectName}/domains`,
        {
          method: 'POST',
          headers: cfHeaders,
          body: { name: domain },
        },
      )
      cfDomainId = cfResult.result.id
      cfStatus = cfResult.result.status === 'active' ? 'active' : 'pending'
    }
    catch (error: any) {
      const msg = error?.data?.errors?.[0]?.message || error?.message || 'Failed to add domain'
      throw createError({ statusCode: 400, message: msg })
    }

    // Save to D1
    const id = `dom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const [record] = await db.insert(schema.domains).values({
      id,
      projectId,
      domain,
      cfDomainId,
      status: cfStatus as 'pending' | 'active' | 'error',
    }).returning()

    // Update project's primary custom domain (for display)
    if (!project.customDomain) {
      await db
        .update(schema.projects)
        .set({ customDomain: domain, updatedAt: new Date().toISOString() })
        .where(eq(schema.projects.id, projectId))
    }

    return {
      ...record,
      isDefault: false,
      dnsTarget: `${cfProjectName}.pages.dev`,
      dnsInstructions: `Add a CNAME record for "${domain}" pointing to "${cfProjectName}.pages.dev"`,
    }
  }

  // -------------------------------------------------------------------------
  // DELETE — remove domain
  // -------------------------------------------------------------------------
  if (event.method === 'DELETE') {
    const body = await readBody<{ domainId: string }>(event)
    if (!body.domainId) {
      throw createError({ statusCode: 400, message: 'domainId is required' })
    }

    const [domainRecord] = await db
      .select()
      .from(schema.domains)
      .where(eq(schema.domains.id, body.domainId))

    if (!domainRecord) {
      throw createError({ statusCode: 404, message: 'Domain not found' })
    }

    // Remove from Cloudflare
    if (cfProjectName && domainRecord.cfDomainId) {
      try {
        await ofetch(
          `${CF_API_BASE}/accounts/${cfAccountId}/pages/projects/${cfProjectName}/domains/${domainRecord.cfDomainId}`,
          { method: 'DELETE', headers: cfHeaders },
        )
      }
      catch (error) {
        console.warn('[domains] Failed to remove from CF:', error)
      }
    }

    // Remove from D1
    await db.delete(schema.domains).where(eq(schema.domains.id, body.domainId))

    // Update project's primary custom domain
    if (project.customDomain === domainRecord.domain) {
      const [nextDomain] = await db
        .select()
        .from(schema.domains)
        .where(eq(schema.domains.projectId, projectId))
        .limit(1)
      await db
        .update(schema.projects)
        .set({
          customDomain: nextDomain?.domain ?? null,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.projects.id, projectId))
    }

    return { success: true }
  }
})
