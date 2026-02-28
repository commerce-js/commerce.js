// ---------------------------------------------------------------------------
// POST /api/github/repos — create a new repo from the Commerce.js template
// Falls back to regular repo creation if the template is inaccessible
// ---------------------------------------------------------------------------

import { getUserSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }

  const body = await readBody<{
    name: string
    description?: string
    private?: boolean
  }>(event)

  if (!body.name) {
    throw createError({ statusCode: 400, message: 'Repository name is required' })
  }

  const description = body.description || 'Commerce.js storefront'
  const isPrivate = body.private ?? false

  // Try template-based creation first, fall back to regular repo
  try {
    const templateRes = await fetch(
      'https://api.github.com/repos/commerce-js/storefront-starter/generate',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.githubToken}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'User-Agent': 'CommerceJS-Cloud',
        },
        body: JSON.stringify({
          owner: session.githubUsername,
          name: body.name,
          description,
          private: isPrivate,
          include_all_branches: false,
        }),
      },
    )

    if (!templateRes.ok) {
      const errBody = await templateRes.text()
      throw new Error(`Template creation failed: ${templateRes.status} ${errBody}`)
    }

    const newRepo = await templateRes.json()
    return formatRepo(newRepo)
  }
  catch (templateError: any) {
    console.warn('[github/repos] Template creation failed, falling back to regular repo:', templateError?.message)

    // Fallback: create a regular repo with auto-init
    const fallbackRes = await fetch(
      'https://api.github.com/user/repos',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.githubToken}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'User-Agent': 'CommerceJS-Cloud',
        },
        body: JSON.stringify({
          name: body.name,
          description,
          private: isPrivate,
          auto_init: true,
        }),
      },
    )

    if (!fallbackRes.ok) {
      const errData = await fallbackRes.text()
      let message = 'Failed to create repository'
      try {
        const parsed = JSON.parse(errData)
        message = parsed.message || message
      }
      catch {}

      throw createError({
        statusCode: fallbackRes.status,
        message: `GitHub: ${message}`,
      })
    }

    const newRepo = await fallbackRes.json()
    return formatRepo(newRepo)
  }
})

function formatRepo(repo: any) {
  return {
    id: repo.id,
    fullName: repo.full_name,
    name: repo.name,
    private: repo.private,
    defaultBranch: repo.default_branch || 'main',
    url: repo.html_url,
  }
}
