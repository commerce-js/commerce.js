# CommerceJS Next Phase — Plan

> E2E validation, new composables, token refresh, and storefront readiness

---
<!-- PROGRESS SECTION -->

### Progress Summary

* [x] **Research & Strategy Selection** ✅ Completed
  - Explored existing composable patterns
  - Evaluated 3 token refresh approaches
  - Selected Option A: Server-Only Token Refresh

* [x] [**T01**: Token Refresh in SallaClient](tasks/T01.md) - Status: ✅ Completed
* [x] [**T02**: New Composables (useBrands, useCountries, useLocations)](tasks/T02.md) - Status: ✅ Completed
* [x] [**T03**: Client Plugin Update](tasks/T03.md) - Status: ✅ Completed
* [x] [**T04**: E2E Validation](tasks/T04.md) - Status: ✅ Completed

<!-- END PROGRESS SECTION -->

---

## Research & Strategy Selection
**Status**: ✅ **Completed**

### Goal
Determine the optimal approach for:
1. **E2E validation** — verify full Nuxt stack works (module → Nitro plugin → API routes → adapter → Salla API)
2. **New composables** — `useBrands`, `useCountries`, `useLocations` following established patterns
3. **Token refresh middleware** — auto-refresh OAuth tokens on 401/expired
4. **Client plugin update** — so `$commerce` resolves on the client side

### Context
We've completed the adapter implementation and core wiring. The remaining work is:
- 3 new composables for Tier 2 data
- Token refresh handling (Salla tokens expire, need auto-refresh)
- E2E smoke test to validate the full chain
- Client plugin needs to actually instantiate the adapter

**What's been done (previous sessions)**:
- `@commercejs/types` — 15+ domain types, full `CommerceAdapter` contract
- `@commercejs/adapter-salla` — 12/12 smoke tests, 15 methods implemented
- `@commercejs/core` — 38 API routes registered, Nitro server plugin, 12 composables

**Action Items**:

- [x] Review existing composable patterns (`useStoreInfo`, `useReviews`, `useProducts`)
- [x] Analyze `SallaClient` for token refresh mechanics
- [x] Review `SallaConfig` shape — missing `refreshToken`, `clientId`, `clientSecret`
- [x] Understand client plugin's current state (reads `$commerce` but doesn't create it)
- [x] Identify 2-3 approach options for token refresh
- [x] Present findings and trade-offs to user
- [x] Get user confirmation on selected approach — **Option A selected**

### Key Findings

1. **Composable pattern** is well-established: `useState` + `readonly` + `useAdapter()` + error wrapping via `CommerceError`. The new composables (`useBrands`, `useCountries`, `useLocations`) can follow `useStoreInfo` exactly — simple fetch-and-cache.

2. **Client plugin gap**: `plugin.ts` checks for `$commerce` but never creates it. Need to either:
   - Instantiate the adapter in the plugin (mirroring the Nitro plugin)
   - Or defer to API routes only (SSR-only, no client-side adapter)

3. **Token refresh**: `SallaConfig` doesn't have `refreshToken`/`clientId`/`clientSecret` yet. The `SallaClient` has no retry-on-401 logic. Salla OAuth tokens expire (typically 14 days).

4. **`SallaClient.onResponseError`** throws `CommerceError` with code `UNAUTHORIZED` on 401 — this is the hook point for intercepting and refreshing.

### Strategy Proposals

**Option A: Server-Only Token Refresh (Recommended)**
- Description: Add token refresh logic **only in the Nitro server plugin**. Client-side composables call server API routes (never the Salla API directly). The Nitro plugin intercepts 401s, refreshes the token using Salla's `/oauth2/token` endpoint, and retries.
- Pros: Tokens never leave the server. Simple client code. One place to manage refresh logic.
- Cons: Every request goes through server (no direct client calls). Slightly more latency.

**Option B: Dual-Side Token Refresh**
- Description: Both the Nitro plugin AND the client plugin handle token refresh independently. Client gets token via a server endpoint.
- Pros: Faster client-side calls. Works for SPAs without SSR.
- Cons: Token exposed to client. Duplicate refresh logic. More complex.

**Option C: Proxy-Only (No Client Adapter)**
- Description: Remove the client-side adapter entirely. All composables use `$fetch` to call server API routes. No `useAdapter()` on client.
- Pros: Simplest. No token management on client. Works with any auth strategy.
- Cons: Requires rewriting all composables to use `$fetch`. Loses type safety from adapter contract.

### Selected Approach

**Decision**: Option A — Server-Only Token Refresh

**Rationale**: Tokens stay server-side (most secure). Single point of refresh logic in the Nitro plugin. Composables already call `useAdapter()` which can proxy through API routes. Aligns with Nuxt SSR best practices.

**Key Findings**:
- `SallaConfig` needs `refreshToken`, `clientId`, `clientSecret` fields
- `SallaClient.onResponseError` already throws `UNAUTHORIZED` on 401 — ideal hook for intercept-refresh-retry
- Composable pattern is uniform: `useState` + `readonly` + `useAdapter()` + `CommerceError` wrapping
- Client plugin needs to provide `$commerce` that proxies to server API routes (not direct Salla API)

**Implementation Plan**:
1. Add refresh fields to `SallaConfig` and implement token refresh in `SallaClient`
2. Update Nitro server plugin to pass refresh credentials
3. Create 3 new composables following `useStoreInfo` pattern
4. Register composables in barrel export
5. Update client plugin to provide a proxy adapter or mark as SSR-only
6. Run E2E validation with a Nuxt dev server
7. Build all packages and verify

### Dependencies
- `@commercejs/adapter-salla` — built and working
- `@commercejs/core` — 38 routes registered, Nitro plugin injecting adapter
- Salla OAuth credentials in `.env`

### Related Files
- `packages/core/src/runtime/composables/useStoreInfo.ts` — Pattern for new composables
- `packages/core/src/runtime/plugin.ts` — Client plugin (needs update)
- `packages/core/src/runtime/server/plugins/commerce-adapter.ts` — Nitro plugin
- `packages/adapter-salla/src/client.ts` — SallaClient (token refresh hook point)
- `packages/adapter-salla/src/types.ts` — SallaConfig (needs refresh fields)

---

## Implementation Tasks

> Task files will be created in the `tasks/` subfolder during Phase 4.

---

## Lessons Learned (Post-Implementation)

> Fill this section out after completing the feature

### What Went Well
- [TBD]

### What Could Be Improved
- [TBD]

---

<!-- META_INFORMATION -->
## Task Status Legend
- 🔴 **Blocked**: Requires external dependency or decision
- 🟡 **Planned**: Ready to implement
- 🟢 **In Progress**: Currently being worked on
- ✅ **Completed**: Done

## Change Log

- **2026-02-08 14:25**: Initial plan setup, research started
- **2026-02-08 14:25**: Key findings documented, 3 strategy proposals created
- **2026-02-08 14:28**: User selected Option A (Server-Only Token Refresh)
- **2026-02-08 14:28**: Task breakdown created (T01-T04)
- **2026-02-08 14:31**: T01 completed — token refresh in SallaClient
- **2026-02-08 14:31**: T02 completed — 3 new composables
- **2026-02-08 14:31**: T03 completed — client plugin SSR-only update
- **2026-02-08 14:31**: T04 completed — full build verified (3/3 packages, 47.3 KB)
<!-- META_INFORMATION -->
