// ---------------------------------------------------------------------------
// MedusaClient — HTTP client for Medusa V2 Store API
// ---------------------------------------------------------------------------
// Authentication: x-publishable-api-key header (required)
// Customer auth: Bearer JWT token (optional, for authenticated endpoints)
// Pagination: offset/limit based (unlike Salla's page/perPage)
// ---------------------------------------------------------------------------

import { ofetch, type $Fetch } from 'ofetch'
import { CommerceError } from '@commercejs/types'
import type { MedusaConfig } from './types.js'

export class MedusaClient {
  private readonly baseUrl: string
  private readonly publishableApiKey: string
  private apiToken: string | undefined
  private readonly http: $Fetch

  constructor(config: MedusaConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '')
    this.publishableApiKey = config.publishableApiKey
    this.apiToken = config.apiToken

    this.http = ofetch.create({
      baseURL: `${this.baseUrl}/store`,
      timeout: config.timeout ?? 30_000,
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': this.publishableApiKey,
      },
      retry: 1,
      retryDelay: 500,
      onResponseError: ({ response }) => {
        throw this.mapError(response)
      },
    })
  }

  /** Update the JWT token (e.g. after login) */
  setToken(token: string): void {
    this.apiToken = token
  }

  /** Clear the JWT token (e.g. after logout) */
  clearToken(): void {
    this.apiToken = undefined
  }

  /** GET request */
  async get<T>(path: string, query?: Record<string, unknown>): Promise<T> {
    return this.http<T>(path, {
      method: 'GET',
      query,
      headers: this.buildHeaders(),
    })
  }

  /** POST request */
  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.http<T>(path, {
      method: 'POST',
      body: body as Record<string, any>,
      headers: this.buildHeaders(),
    })
  }

  /** DELETE request */
  async del<T>(path: string): Promise<T> {
    return this.http<T>(path, {
      method: 'DELETE',
      headers: this.buildHeaders(),
    })
  }

  // ---- Auth endpoints (outside /store prefix) ----

  /** POST to auth endpoints (Medusa auth routes are at /auth, not /store) */
  async authPost<T>(path: string, body?: unknown): Promise<T> {
    return ofetch<T>(`${this.baseUrl}${path}`, {
      method: 'POST',
      body: body as Record<string, any>,
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': this.publishableApiKey,
        ...(this.apiToken ? { Authorization: `Bearer ${this.apiToken}` } : {}),
      },
      onResponseError: ({ response }) => {
        throw this.mapError(response)
      },
    })
  }

  /** DELETE to auth endpoints */
  async authDelete<T>(path: string): Promise<T> {
    return ofetch<T>(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': this.publishableApiKey,
        ...(this.apiToken ? { Authorization: `Bearer ${this.apiToken}` } : {}),
      },
      onResponseError: ({ response }) => {
        throw this.mapError(response)
      },
    })
  }

  // ---- Pagination helper ----

  /**
   * Fetch a paginated endpoint using Medusa's offset/limit pattern.
   * Converts to page/perPage for the Commerce.js contract.
   */
  async paginated<T>(
    path: string,
    dataKey: string,
    params: { page?: number; perPage?: number; query?: Record<string, unknown> } = {},
  ): Promise<{ data: T[]; total: number; page: number; perPage: number }> {
    const page = params.page ?? 1
    const perPage = params.perPage ?? 20
    const offset = (page - 1) * perPage

    const response = await this.get<Record<string, unknown>>(path, {
      offset,
      limit: perPage,
      ...params.query,
    })

    return {
      data: (response[dataKey] as T[]) ?? [],
      total: (response.count as number) ?? 0,
      page,
      perPage,
    }
  }

  // ---- Internal ----

  private buildHeaders(): Record<string, string> {
    if (!this.apiToken) return {}
    return {
      Authorization: `Bearer ${this.apiToken}`,
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapError(response: any): CommerceError {
    const status = (response?.status ?? 500) as number
    const data = response?._data as { message?: string; type?: string } | undefined

    const message = data?.message ?? `Medusa API error (${status})`

    switch (status) {
      case 400:
        return new CommerceError(message, 'VALIDATION', status)
      case 401:
        return new CommerceError(message, 'UNAUTHORIZED', status)
      case 403:
        return new CommerceError(message, 'FORBIDDEN', status)
      case 404:
        return new CommerceError(message, 'NOT_FOUND', status)
      case 429:
        return new CommerceError(message, 'RATE_LIMIT', status)
      default:
        return new CommerceError(message, 'PLATFORM_ERROR', status)
    }
  }
}
