-- Migration 0003: Add users table for GitHub OAuth
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT,
  name TEXT NOT NULL,
  avatar_url TEXT,
  github_id INTEGER UNIQUE NOT NULL,
  github_username TEXT NOT NULL,
  github_access_token TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
