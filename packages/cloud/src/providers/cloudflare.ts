// ---------------------------------------------------------------------------
// Cloudflare Provider — manages Workers, Pages, R2, KV, and custom domains
// ---------------------------------------------------------------------------

import { ofetch, type $Fetch } from 'ofetch'
import type { CloudflareConfig } from '../types.js'

const CF_API_BASE = 'https://api.cloudflare.com/client/v4'

/**
 * Cloudflare REST API client for CommerceJS Cloud.
 *
 * Manages the infrastructure for deployed stores:
 * - Pages projects (Nuxt SSR storefront)
 * - R2 buckets (product images, assets)
 * - KV namespaces (cart sessions, cache)
 * - Custom domains
 */
export class CloudflareProvider {
  private client: $Fetch
  private accountId: string

  constructor(config: CloudflareConfig) {
    this.accountId = config.accountId
    this.client = ofetch.create({
      baseURL: CF_API_BASE,
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
    })
  }

  // ---------------------------------------------------------------------------
  // Pages Projects
  // ---------------------------------------------------------------------------

  /**
   * Create a Cloudflare Pages project for a store's storefront.
   */
  async createPagesProject(name: string, options?: {
    productionBranch?: string
  }): Promise<{ id: string; name: string; subdomain: string }> {
    const response = await this.client<{ result: any }>(
      `/accounts/${this.accountId}/pages/projects`,
      {
        method: 'POST',
        body: {
          name,
          production_branch: options?.productionBranch ?? 'main',
        },
      },
    )

    return {
      id: response.result.id,
      name: response.result.name,
      subdomain: `${response.result.name}.pages.dev`,
    }
  }

  /**
   * Deploy to a Pages project (direct upload).
   */
  async deployPages(projectName: string, outputDir: string): Promise<{
    id: string
    url: string
    environment: string
  }> {
    // Pages Direct Upload uses multipart form data
    // In production, this would upload the build output directory
    const response = await this.client<{ result: any }>(
      `/accounts/${this.accountId}/pages/projects/${projectName}/deployments`,
      {
        method: 'POST',
        body: {
          // Direct upload would use FormData with the build output
          // For now, we'll use the wrangler CLI for deployments
          branch: 'main',
        },
      },
    )

    return {
      id: response.result.id,
      url: response.result.url,
      environment: response.result.environment,
    }
  }

  /**
   * Delete a Pages project.
   */
  async deletePagesProject(projectName: string): Promise<void> {
    await this.client(
      `/accounts/${this.accountId}/pages/projects/${projectName}`,
      { method: 'DELETE' },
    )
  }

  /**
   * Get deployment status.
   */
  async getDeployment(projectName: string, deploymentId: string): Promise<{
    id: string
    url: string
    environment: string
    latest_stage: { name: string; status: string }
  }> {
    const response = await this.client<{ result: any }>(
      `/accounts/${this.accountId}/pages/projects/${projectName}/deployments/${deploymentId}`,
    )
    return response.result
  }

  /**
   * Get deployment logs.
   */
  async getDeploymentLogs(projectName: string, deploymentId: string): Promise<{
    data: Array<{ timestamp: string; line: string }>
  }> {
    const response = await this.client<{ result: any }>(
      `/accounts/${this.accountId}/pages/projects/${projectName}/deployments/${deploymentId}/history/logs`,
    )
    return response.result
  }

  // ---------------------------------------------------------------------------
  // R2 Object Storage
  // ---------------------------------------------------------------------------

  /**
   * Create an R2 bucket for store assets (product images, media).
   */
  async createR2Bucket(name: string): Promise<{ name: string }> {
    await this.client(
      `/accounts/${this.accountId}/r2/buckets`,
      {
        method: 'POST',
        body: { name },
      },
    )
    return { name }
  }

  /**
   * Delete an R2 bucket.
   */
  async deleteR2Bucket(name: string): Promise<void> {
    await this.client(
      `/accounts/${this.accountId}/r2/buckets/${name}`,
      { method: 'DELETE' },
    )
  }

  // ---------------------------------------------------------------------------
  // KV Namespaces
  // ---------------------------------------------------------------------------

  /**
   * Create a KV namespace for cart sessions and cache.
   */
  async createKVNamespace(title: string): Promise<{ id: string; title: string }> {
    const response = await this.client<{ result: any }>(
      `/accounts/${this.accountId}/storage/kv/namespaces`,
      {
        method: 'POST',
        body: { title },
      },
    )

    return {
      id: response.result.id,
      title: response.result.title,
    }
  }

  /**
   * Delete a KV namespace.
   */
  async deleteKVNamespace(namespaceId: string): Promise<void> {
    await this.client(
      `/accounts/${this.accountId}/storage/kv/namespaces/${namespaceId}`,
      { method: 'DELETE' },
    )
  }

  // ---------------------------------------------------------------------------
  // Custom Domains
  // ---------------------------------------------------------------------------

  /**
   * Add a custom domain to a Pages project.
   */
  async addCustomDomain(projectName: string, domain: string): Promise<{
    id: string
    domain: string
    status: string
  }> {
    const response = await this.client<{ result: any }>(
      `/accounts/${this.accountId}/pages/projects/${projectName}/domains`,
      {
        method: 'POST',
        body: { name: domain },
      },
    )

    return {
      id: response.result.id,
      domain: response.result.name,
      status: response.result.status,
    }
  }

  /**
   * Remove a custom domain from a Pages project.
   */
  async removeCustomDomain(projectName: string, domainId: string): Promise<void> {
    await this.client(
      `/accounts/${this.accountId}/pages/projects/${projectName}/domains/${domainId}`,
      { method: 'DELETE' },
    )
  }

  // ---------------------------------------------------------------------------
  // Teardown
  // ---------------------------------------------------------------------------

  /**
   * Tear down all resources for a project.
   */
  async teardownProject(config: {
    projectName: string
    r2Bucket?: string
    kvNamespaceId?: string
  }): Promise<void> {
    const teardowns = [
      this.deletePagesProject(config.projectName),
    ]

    if (config.r2Bucket) {
      teardowns.push(this.deleteR2Bucket(config.r2Bucket))
    }
    if (config.kvNamespaceId) {
      teardowns.push(this.deleteKVNamespace(config.kvNamespaceId))
    }

    await Promise.allSettled(teardowns)
  }
}
