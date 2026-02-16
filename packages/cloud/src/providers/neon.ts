// ---------------------------------------------------------------------------
// Neon Provider — manages Postgres databases and branches for preview envs
// ---------------------------------------------------------------------------

import { ofetch, type $Fetch } from 'ofetch'
import type { NeonConfig } from '../types.js'

const NEON_API_BASE = 'https://console.neon.tech/api/v2'

/**
 * Neon Postgres API client for CommerceJS Cloud.
 *
 * Manages serverless Postgres databases:
 * - Project creation (one Neon project per Cloud project)
 * - Branch management (branch-per-PR for preview environments)
 * - Connection string provisioning
 */
export class NeonProvider {
  private client: $Fetch
  private defaultProjectId?: string

  constructor(config: NeonConfig) {
    this.defaultProjectId = config.projectId
    this.client = ofetch.create({
      baseURL: NEON_API_BASE,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    })
  }

  // ---------------------------------------------------------------------------
  // Projects
  // ---------------------------------------------------------------------------

  /**
   * Create a Neon project for a new Cloud store.
   * Each Cloud project gets its own Neon project with a main branch.
   */
  async createProject(name: string, options?: {
    region?: string
  }): Promise<{
    projectId: string
    branchId: string
    connectionUri: string
    host: string
  }> {
    const response = await this.client<{ project: any; branch: any; connection_uris: any[] }>(
      '/projects',
      {
        method: 'POST',
        body: {
          project: {
            name,
            region_id: options?.region ?? 'aws-eu-central-1',
            pg_version: 16,
          },
        },
      },
    )

    return {
      projectId: response.project.id,
      branchId: response.branch.id,
      connectionUri: response.connection_uris[0]?.connection_uri ?? '',
      host: response.branch.host ?? '',
    }
  }

  /**
   * Delete a Neon project and all its branches.
   */
  async deleteProject(projectId: string): Promise<void> {
    await this.client(`/projects/${projectId}`, { method: 'DELETE' })
  }

  // ---------------------------------------------------------------------------
  // Branches (for preview environments)
  // ---------------------------------------------------------------------------

  /**
   * Create a branch from the main branch.
   * Used for preview environments — each PR gets its own DB branch.
   */
  async createBranch(projectId: string, options: {
    name: string
    parentBranchId?: string
    expiresAt?: string
  }): Promise<{
    branchId: string
    connectionUri: string
    host: string
  }> {
    const resolvedProjectId = projectId || this.defaultProjectId
    if (!resolvedProjectId) throw new Error('Neon project ID is required')

    const response = await this.client<{ branch: any; endpoints: any[]; connection_uris: any[] }>(
      `/projects/${resolvedProjectId}/branches`,
      {
        method: 'POST',
        body: {
          branch: {
            name: options.name,
            parent_id: options.parentBranchId,
          },
          endpoints: [{ type: 'read_write' }],
        },
      },
    )

    return {
      branchId: response.branch.id,
      connectionUri: response.connection_uris?.[0]?.connection_uri ?? '',
      host: response.endpoints?.[0]?.host ?? '',
    }
  }

  /**
   * Delete a branch (cleanup after PR merge/close).
   */
  async deleteBranch(projectId: string, branchId: string): Promise<void> {
    const resolvedProjectId = projectId || this.defaultProjectId
    if (!resolvedProjectId) throw new Error('Neon project ID is required')

    await this.client(
      `/projects/${resolvedProjectId}/branches/${branchId}`,
      { method: 'DELETE' },
    )
  }

  /**
   * List all branches for a project.
   */
  async listBranches(projectId: string): Promise<Array<{
    id: string
    name: string
    primary: boolean
    createdAt: string
  }>> {
    const resolvedProjectId = projectId || this.defaultProjectId
    if (!resolvedProjectId) throw new Error('Neon project ID is required')

    const response = await this.client<{ branches: any[] }>(
      `/projects/${resolvedProjectId}/branches`,
    )

    return response.branches.map(b => ({
      id: b.id,
      name: b.name,
      primary: b.primary ?? false,
      createdAt: b.created_at,
    }))
  }

  // ---------------------------------------------------------------------------
  // Connection
  // ---------------------------------------------------------------------------

  /**
   * Get the connection string for a specific branch.
   */
  async getConnectionString(projectId: string, branchId: string): Promise<string> {
    const resolvedProjectId = projectId || this.defaultProjectId
    if (!resolvedProjectId) throw new Error('Neon project ID is required')

    const response = await this.client<{ connection_uris: any[] }>(
      `/projects/${resolvedProjectId}/connection_uri`,
      {
        params: { branch_id: branchId, role_name: 'neondb_owner' },
      },
    )

    return response.connection_uris?.[0]?.connection_uri ?? ''
  }
}
