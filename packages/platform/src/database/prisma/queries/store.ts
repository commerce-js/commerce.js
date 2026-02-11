// ---------------------------------------------------------------------------
// Prisma: Store queries
// ---------------------------------------------------------------------------

import { getDb } from '../client.js'

export async function findStoreInfo(id: string) {
  const row = await getDb().storeInfo.findUnique({ where: { id } })
  if (!row) return null

  // Parse JSON string fields to arrays (Prisma returns raw strings for String columns)
  return {
    ...row,
    supportedCurrencies: row.supportedCurrencies
      ? JSON.parse(row.supportedCurrencies as string)
      : null,
    supportedLocales: row.supportedLocales
      ? JSON.parse(row.supportedLocales as string)
      : null,
  }
}

export async function createStoreInfo(data: Record<string, any>) {
  // Serialize arrays to JSON strings for Prisma's String columns
  const prismaData = { ...data }
  if (Array.isArray(prismaData.supportedCurrencies)) {
    prismaData.supportedCurrencies = JSON.stringify(prismaData.supportedCurrencies)
  }
  if (Array.isArray(prismaData.supportedLocales)) {
    prismaData.supportedLocales = JSON.stringify(prismaData.supportedLocales)
  }
  await getDb().storeInfo.create({ data: prismaData as any })
}
