// ---------------------------------------------------------------------------
// D1 Database Schema — Cloud Projects, Deployments, Environment Variables
// ---------------------------------------------------------------------------

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

/**
 * Users — GitHub-authenticated dashboard users.
 */
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email'),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  githubId: integer('github_id').unique().notNull(),
  githubUsername: text('github_username').notNull(),
  githubAccessToken: text('github_access_token'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})

/**
 * Cloud projects — each represents a deployed CommerceJS store.
 */
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  ownerId: text('owner_id').notNull(),
  repoUrl: text('repo_url'),
  customDomain: text('custom_domain'),
  subdomain: text('subdomain').notNull(),
  plan: text('plan', { enum: ['starter', 'pro', 'enterprise'] }).notNull().default('starter'),
  // Cloudflare resource IDs
  cfPagesProjectName: text('cf_pages_project_name'),
  r2BucketName: text('r2_bucket_name'),
  kvNamespaceId: text('kv_namespace_id'),
  // Neon resource IDs
  neonProjectId: text('neon_project_id'),
  neonBranchId: text('neon_branch_id'),
  dbConnectionString: text('db_connection_string'),
  // GitHub integration
  githubWebhookSecret: text('github_webhook_secret'),
  // Timestamps
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})

/**
 * Deployments — each deploy of a project.
 */
export const deployments = sqliteTable('deployments', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  environment: text('environment', { enum: ['production', 'staging', 'preview'] }).notNull(),
  status: text('status', { enum: ['building', 'deploying', 'ready', 'failed'] }).notNull(),
  url: text('url'),
  branch: text('branch'),
  commitSha: text('commit_sha'),
  prNumber: integer('pr_number'),
  error: text('error'),
  buildDurationMs: integer('build_duration_ms'),
  deployedAt: text('deployed_at').notNull().$defaultFn(() => new Date().toISOString()),
})

/**
 * Environment variables — per-project secrets and config.
 */
export const envVars = sqliteTable('env_vars', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  key: text('key').notNull(),
  value: text('value').notNull(),
  isSecret: integer('is_secret', { mode: 'boolean' }).notNull().default(false),
  environment: text('environment', { enum: ['production', 'staging', 'preview', 'all'] }).notNull().default('all'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})
