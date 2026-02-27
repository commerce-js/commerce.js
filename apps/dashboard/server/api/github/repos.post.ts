// ---------------------------------------------------------------------------
// POST /api/github/repos — create a new repo for a Commerce.js project
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

  try {
    // Create a new repository under the authenticated user
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
          description: body.description || 'Commerce.js storefront',
          private: body.private ?? false,
          auto_init: true, // Initialize with README
        },
      },
    )

    return {
      id: newRepo.id,
      fullName: newRepo.full_name,
      name: newRepo.name,
      private: newRepo.private,
      defaultBranch: newRepo.default_branch || 'main',
      url: newRepo.html_url,
    }
  }
  catch (error: any) {
    console.error('[github/repos] Create failed:', error?.data || error?.message)
    const status = error?.response?.status || error?.statusCode || 500
    const message = error?.data?.message || error?.message || 'Failed to create repository'

    throw createError({
      statusCode: status,
      message: `GitHub: ${message}`,
    })
  }
})

