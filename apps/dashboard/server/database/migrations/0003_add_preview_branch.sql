-- ---------------------------------------------------------------------------
-- 0003: Add preview branch tracking to deployments
-- ---------------------------------------------------------------------------

ALTER TABLE deployments ADD COLUMN neon_preview_branch_id TEXT;
