// Prisma `select` for ApiKey rows that is safe to return to the client.
// Deliberately omits `keyHash` — the client never needs it and exposing the
// hash widens the offline attack surface. Shared by every route that returns
// API-key metadata so the safe shape can't drift.
export const PUBLIC_API_KEY_SELECT = {
  id: true,
  keyPrefix: true,
  name: true,
  lastUsed: true,
  createdAt: true,
}
