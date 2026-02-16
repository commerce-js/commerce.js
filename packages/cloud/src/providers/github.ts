// ---------------------------------------------------------------------------
// GitHub Provider — repo access, webhooks, and PR detection
// ---------------------------------------------------------------------------

import { ofetch, type $Fetch } from 'ofetch'
import type { GitHubConfig } from '../types.js'

const GITHUB_API_BASE = 'https://api.github.com'

/**
 * GitHub API client for CommerceJS Cloud.
 *
 * Manages the GitHub integration:
 * - Repository webhook installation (push-to-deploy)
 * - PR detection for preview environments
 * - Repository cloning for builds
 */
export class GitHubProvider {
  private client: $Fetch
  private appId: string
  private installationId?: string

  constructor(config: GitHubConfig) {
    this.appId = config.appId
    this.installationId = config.installationId
    this.client = ofetch.create({
      baseURL: GITHUB_API_BASE,
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })
  }

  /**
   * Set the authentication token (from GitHub App installation).
   */
  setToken(token: string): void {
    this.client = ofetch.create({
      baseURL: GITHUB_API_BASE,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })
  }

  // ---------------------------------------------------------------------------
  // Webhooks
  // ---------------------------------------------------------------------------

  /**
   * Install a webhook on a repository for push-to-deploy.
   */
  async installWebhook(owner: string, repo: string, webhookUrl: string): Promise<{
    id: number
    active: boolean
  }> {
    const response = await this.client<any>(
      `/repos/${owner}/${repo}/hooks`,
      {
        method: 'POST',
        body: {
          name: 'web',
          active: true,
          events: ['push', 'pull_request'],
          config: {
            url: webhookUrl,
            content_type: 'json',
            insecure_ssl: '0',
          },
        },
      },
    )

    return {
      id: response.id,
      active: response.active,
    }
  }

  /**
   * Remove a webhook from a repository.
   */
  async removeWebhook(owner: string, repo: string, hookId: number): Promise<void> {
    await this.client(
      `/repos/${owner}/${repo}/hooks/${hookId}`,
      { method: 'DELETE' },
    )
  }

  // ---------------------------------------------------------------------------
  // Repository Info
  // ---------------------------------------------------------------------------

  /**
   * Get repository info.
   */
  async getRepo(owner: string, repo: string): Promise<{
    fullName: string
    defaultBranch: string
    private: boolean
    cloneUrl: string
  }> {
    const response = await this.client<any>(`/repos/${owner}/${repo}`)

    return {
      fullName: response.full_name,
      defaultBranch: response.default_branch,
      private: response.private,
      cloneUrl: response.clone_url,
    }
  }

  /**
   * Get the latest commit SHA for a branch.
   */
  async getLatestCommit(owner: string, repo: string, branch: string): Promise<{
    sha: string
    message: string
    author: string
  }> {
    const response = await this.client<any>(
      `/repos/${owner}/${repo}/commits/${branch}`,
    )

    return {
      sha: response.sha,
      message: response.commit.message,
      author: response.commit.author.name,
    }
  }

  // ---------------------------------------------------------------------------
  // Pull Requests
  // ---------------------------------------------------------------------------

  /**
   * Get PR details (for preview environment deployments).
   */
  async getPullRequest(owner: string, repo: string, prNumber: number): Promise<{
    number: number
    title: string
    branch: string
    baseBranch: string
    sha: string
    state: string
  }> {
    const response = await this.client<any>(
      `/repos/${owner}/${repo}/pulls/${prNumber}`,
    )

    return {
      number: response.number,
      title: response.title,
      branch: response.head.ref,
      baseBranch: response.base.ref,
      sha: response.head.sha,
      state: response.state,
    }
  }

  /**
   * Post a comment on a PR (e.g., preview deployment URL).
   */
  async commentOnPR(owner: string, repo: string, prNumber: number, body: string): Promise<{
    id: number
  }> {
    const response = await this.client<any>(
      `/repos/${owner}/${repo}/issues/${prNumber}/comments`,
      {
        method: 'POST',
        body: { body },
      },
    )

    return { id: response.id }
  }

  // ---------------------------------------------------------------------------
  // Webhook Event Parsing
  // ---------------------------------------------------------------------------

  /**
   * Parse a GitHub webhook payload to determine the action.
   */
  parseWebhookEvent(headers: Record<string, string>, payload: any): {
    type: 'push' | 'pull_request' | 'unknown'
    branch: string
    commitSha: string
    prNumber?: number
    action?: string
    repo: { owner: string; name: string }
  } {
    const eventType = headers['x-github-event']

    if (eventType === 'push') {
      const ref = payload.ref as string
      const branch = ref.replace('refs/heads/', '')
      return {
        type: 'push',
        branch,
        commitSha: payload.after,
        repo: {
          owner: payload.repository.owner.login,
          name: payload.repository.name,
        },
      }
    }

    if (eventType === 'pull_request') {
      return {
        type: 'pull_request',
        branch: payload.pull_request.head.ref,
        commitSha: payload.pull_request.head.sha,
        prNumber: payload.pull_request.number,
        action: payload.action,
        repo: {
          owner: payload.repository.owner.login,
          name: payload.repository.name,
        },
      }
    }

    return {
      type: 'unknown',
      branch: '',
      commitSha: '',
      repo: { owner: '', name: '' },
    }
  }
}
