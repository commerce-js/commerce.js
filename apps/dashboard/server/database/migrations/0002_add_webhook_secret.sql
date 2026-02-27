-- Add GitHub webhook secret column to projects table
-- Each project can have its own webhook secret for signature verification
ALTER TABLE projects ADD COLUMN github_webhook_secret TEXT;
