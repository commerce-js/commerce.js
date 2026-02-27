-- ---------------------------------------------------------------------------
-- 0002: Add domains table for custom domain management
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS domains (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  cf_domain_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_domains_project_id ON domains(project_id);
