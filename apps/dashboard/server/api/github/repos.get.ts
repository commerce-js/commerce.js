// ---------------------------------------------------------------------------
// GET /api/github/repos — list authenticated user's GitHub repositories
// ---------------------------------------------------------------------------

import { getUserSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }

  const query = getQuery(event)
  const page = Number(query.page) || 1
  const perPage = Number(query.per_page) || 30
  const sort = (query.sort as string) || 'updated'

  // Fetch repos from GitHub API
  const repos = await $fetch<any[]>('https://api.github.com/user/repos', {
    headers: {
      Authorization: `Bearer ${session.githubToken}`,
      Accept: 'application/vnd.github+json',
    },
    query: {
      sort,
      per_page: perPage,
      page,
      type: 'owner', // Only repos owned by the user (not forks from orgs)
    },
  })

  // Return a simplified list
  return repos.map((repo: any) => ({
    id: repo.id,
    fullName: repo.full_name,
    name: repo.name,
    private: repo.private,
    defaultBranch: repo.default_branch,
    updatedAt: repo.updated_at,
    description: repo.description,
    language: repo.language,
    url: repo.html_url,
  }))
})
