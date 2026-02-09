// ---------------------------------------------------------------------------
// Salla HTTP client — wraps ofetch with auth, pagination, and error mapping
// ---------------------------------------------------------------------------

import { ofetch, type $Fetch } from 'ofetch'
import { CommerceError } from '@commercejs/types'
import type { SallaConfig, SallaApiResponse } from './types.js'

const DEFAULT_BASE_URL = 'https://api.salla.dev/admin/v2'
const DEFAULT_TIMEOUT = 30_000
const SALLA_TOKEN_URL = 'https://accounts.salla.sa/oauth2/token'

export class SallaClient {
  private http: $Fetch
  readonly config: SallaConfig

  // Token refresh state
  private _accessToken: string
  private _refreshPromise: Promise<string> | null = null

  constructor(config: SallaConfig) {
    this.config = config
    this._accessToken = config.accessToken

    this.http = this.createHttpClient(this._accessToken)
  }

  // ---- Internal: create ofetch instance with a given token ----

  private createHttpClient(token: string): $Fetch {
    return ofetch.create({
      baseURL: this.config.baseUrl ?? DEFAULT_BASE_URL,
      timeout: this.config.timeout ?? DEFAULT_TIMEOUT,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      retry: 2,
      retryDelay: 500,

      onResponseError({ response: _response }) {
        const response = _response as unknown as { status: number; _data: unknown }
        const status = response?.status ?? 0
        const body = response?._data as { error?: { message?: string }; message?: string } | null

        const message =
          body?.error?.message ?? body?.message ?? `Salla API error (HTTP ${status})`

        let code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'VALIDATION' | 'PLATFORM_ERROR' | 'UNKNOWN'
        if (status === 401) code = 'UNAUTHORIZED'
        else if (status === 403) code = 'FORBIDDEN'
        else if (status === 404 || status === 422) code = 'VALIDATION'
        else if (status >= 500) code = 'PLATFORM_ERROR'
        else code = 'UNKNOWN'

        throw new CommerceError(message, code, status)
      },
    })
  }

  // ---- Token Refresh ----

  /** Whether this client has the credentials needed for token refresh */
  get canRefresh(): boolean {
    const { refreshToken, clientId, clientSecret } = this.config
    return !!(refreshToken && clientId && clientSecret)
  }

  /**
   * Refresh the OAuth access token using the refresh token.
   * Uses a mutex so concurrent 401s only trigger one refresh.
   */
  async refreshAccessToken(): Promise<string> {
    if (!this.canRefresh) {
      throw new CommerceError(
        'Cannot refresh token — missing refreshToken, clientId, or clientSecret',
        'UNAUTHORIZED',
        401,
      )
    }

    // Mutex: if a refresh is already in flight, wait for it
    if (this._refreshPromise) {
      return this._refreshPromise
    }

    this._refreshPromise = this._doRefresh()
    try {
      const newToken = await this._refreshPromise
      return newToken
    } finally {
      this._refreshPromise = null
    }
  }

  private async _doRefresh(): Promise<string> {
    const { refreshToken, clientId, clientSecret } = this.config

    const response = await ofetch<{
      access_token: string
      refresh_token?: string
      expires_in?: number
    }>(SALLA_TOKEN_URL, {
      method: 'POST',
      body: {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Update internal state
    this._accessToken = response.access_token

    // Update the refresh token if a new one was issued
    if (response.refresh_token) {
      ;(this.config as { refreshToken?: string }).refreshToken = response.refresh_token
    }

    // Recreate the HTTP client with the new token
    this.http = this.createHttpClient(this._accessToken)

    return this._accessToken
  }

  // ---- Request wrapper with automatic 401 retry ----

  /**
   * Execute a request. If it fails with 401 and refresh credentials
   * are available, refresh the token and retry once.
   */
  private async withRefreshRetry<T>(
    fn: (http: $Fetch) => Promise<T>,
  ): Promise<T> {
    try {
      return await fn(this.http)
    } catch (error: unknown) {
      const err = error as Error & { code?: string }
      if (
        err instanceof CommerceError &&
        err.code === 'UNAUTHORIZED' &&
        this.canRefresh
      ) {
        // Refresh and retry once
        await this.refreshAccessToken()
        return fn(this.http)
      }
      throw err
    }
  }

  // ---- Core request methods ----

  /** GET request — returns the unwrapped response from Salla's response envelope */
  async get<T>(path: string, query?: Record<string, unknown>): Promise<SallaApiResponse<T>> {
    return this.withRefreshRetry((http) =>
      http<SallaApiResponse<T>>(path, { method: 'GET', query }),
    )
  }

  /** POST request */
  async post<T>(path: string, body?: Record<string, unknown>): Promise<SallaApiResponse<T>> {
    return this.withRefreshRetry((http) =>
      http<SallaApiResponse<T>>(path, { method: 'POST', body }),
    )
  }

  /** PUT request */
  async put<T>(path: string, body?: Record<string, unknown>): Promise<SallaApiResponse<T>> {
    return this.withRefreshRetry((http) =>
      http<SallaApiResponse<T>>(path, { method: 'PUT', body }),
    )
  }

  /** DELETE request */
  async delete<T>(path: string): Promise<SallaApiResponse<T>> {
    return this.withRefreshRetry((http) =>
      http<SallaApiResponse<T>>(path, { method: 'DELETE' }),
    )
  }

  // ---- Pagination helper ----

  /** Fetch a paginated list from Salla and return data + pagination */
  async paginated<T>(
    path: string,
    params?: { page?: number; perPage?: number; [key: string]: unknown },
  ): Promise<{ data: T[]; total: number; page: number; perPage: number; totalPages: number }> {
    // Build query — strip our camelCase keys and use Salla's snake_case
    const { page, perPage, ...rest } = params ?? {}
    const query: Record<string, unknown> = {
      ...rest,
      ...(page ? { page } : {}),
      ...(perPage ? { per_page: perPage } : {}),
    }

    const response = await this.get<T[]>(path, query)

    return {
      data: response.data,
      total: response.pagination?.total ?? response.data.length,
      page: response.pagination?.currentPage ?? 1,
      perPage: response.pagination?.perPage ?? response.data.length,
      totalPages: response.pagination?.totalPages ?? 1,
    }
  }
}
