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
    const newRepo = await $fetch<any>(
      'https://api.github.com/repos/commerce-js/storefront-starter/generate',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.githubToken}`,
          Accept: 'application/vnd.github+json',
        },
        body: {
          owner: session.githubUsername,
          name: body.name,
          description,
          private: isPrivate,
          include_all_branches: false,
        },
      },
    )

    return formatRepo(newRepo)
  }
  catch (templateError: any) {
    console.warn('[github/repos] Template creation failed, falling back to regular repo:', templateError?.data?.message || templateError?.message)

    // Fallback: create a regular repo with auto-init
    try {
      const newRepo = await $fetch<any>(
        'https://api.github.com/user/repos',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.githubToken}`,
            Accept: 'application/vnd.github+json',
          },
          body: {
            name: body.name,
            description,
            private: isPrivate,
            auto_init: true,
          },
        },
      )

      return formatRepo(newRepo)
    }
    catch (fallbackError: any) {
      console.error('[github/repos] Fallback creation also failed:', fallbackError?.data || fallbackError?.message)
      const status = fallbackError?.response?.status || fallbackError?.statusCode || 500
      const message = fallbackError?.data?.message || fallbackError?.message || 'Failed to create repository'

      throw createError({
        statusCode: status,
        message: `GitHub: ${message}`,
      })
    }
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
