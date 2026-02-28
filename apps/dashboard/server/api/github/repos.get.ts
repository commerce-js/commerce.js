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

  // Fetch repos from GitHub API (native fetch for CF Workers compatibility)
  const params = new URLSearchParams({
    sort,
    per_page: String(perPage),
    page: String(page),
    type: 'owner', // Only repos owned by the user (not forks from orgs)
  })

  const res = await fetch(`https://api.github.com/user/repos?${params}`, {
    headers: {
      'Authorization': `Bearer ${session.githubToken}`,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'CommerceJS-Cloud',
    },
  })

  if (!res.ok) {
    throw createError({
      statusCode: res.status,
      message: `GitHub API error: ${res.status} ${res.statusText}`,
    })
  }

  const repos = await res.json() as any[]

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
