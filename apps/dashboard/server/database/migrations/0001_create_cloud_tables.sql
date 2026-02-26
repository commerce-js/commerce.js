-- ---------------------------------------------------------------------------
-- D1 Migration: Create Cloud project management tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  repo_url TEXT,
  custom_domain TEXT,
  subdomain TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'starter',
  cf_pages_project_name TEXT,
  r2_bucket_name TEXT,
  kv_namespace_id TEXT,
  neon_project_id TEXT,
  neon_branch_id TEXT,
  db_connection_string TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS deployments (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  environment TEXT NOT NULL DEFAULT 'production',
  status TEXT NOT NULL DEFAULT 'building',
  url TEXT,
  branch TEXT,
  commit_sha TEXT,
  pr_number INTEGER,
  error TEXT,
  build_duration_ms INTEGER,
  deployed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS env_vars (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  is_secret INTEGER NOT NULL DEFAULT 0,
  environment TEXT NOT NULL DEFAULT 'all',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_deployments_project ON deployments(project_id);
CREATE INDEX IF NOT EXISTS idx_env_vars_project ON env_vars(project_id);
