// ---------------------------------------------------------------------------
// GET /api/admin/migrate — one-time migration endpoint
// ---------------------------------------------------------------------------
// Apply D1 migrations to bootstrap the production database.
// Remove this endpoint after the initial migration is applied.
// ---------------------------------------------------------------------------

export default defineEventHandler(async () => {
  const db = hubDatabase()

  const migrations = [
    // 0001: Create cloud tables
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT,
      name TEXT,
      avatar_url TEXT,
      github_id INTEGER UNIQUE,
      github_username TEXT,
      github_access_token TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      repo_url TEXT,
      custom_domain TEXT,
      plan TEXT NOT NULL DEFAULT 'starter',
      cf_pages_project_name TEXT,
      r2_bucket_name TEXT,
      kv_namespace_id TEXT,
      neon_project_id TEXT,
      neon_branch_id TEXT,
      db_connection_string TEXT,
      github_webhook_secret TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS deployments (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id),
      environment TEXT NOT NULL DEFAULT 'production',
      status TEXT NOT NULL DEFAULT 'queued',
      url TEXT,
      branch TEXT,
      commit_sha TEXT,
      pr_number INTEGER,
      error TEXT,
      build_duration_ms INTEGER,
      neon_preview_branch_id TEXT,
      deployed_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    // 0002: Add domains
    `CREATE TABLE IF NOT EXISTS domains (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id),
      domain TEXT NOT NULL,
      cf_domain_id TEXT,
      cf_status TEXT NOT NULL DEFAULT 'pending',
      is_primary INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
  ]

  const results = []
  for (const sql of migrations) {
    try {
      await db.exec(sql)
      results.push({ sql: sql.slice(0, 60) + '...', status: 'ok' })
    }
    catch (error: any) {
      results.push({ sql: sql.slice(0, 60) + '...', status: 'error', error: error.message })
    }
  }

  return { migrated: true, results }
})
