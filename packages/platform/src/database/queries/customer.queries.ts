// ---------------------------------------------------------------------------
// Customer queries
// ---------------------------------------------------------------------------

import type { PrismaDatabase } from '../prisma/client.js'

export function findCustomerByEmail(db: PrismaDatabase, email: string) {
  return db.customer.findUnique({
    where: { email },
    include: { addresses: true },
  })
}

export function findCustomerById(db: PrismaDatabase, id: string) {
  return db.customer.findUnique({
    where: { id },
    include: { addresses: true },
  })
}

export function findCustomers(
  db: PrismaDatabase,
  opts: { limit?: number; offset?: number; search?: string } = {},
) {
  const { limit = 20, offset = 0, search } = opts

  return db.customer.findMany({
    where: search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
          ],
        }
      : undefined,
    include: { addresses: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  })
}

export function createCustomer(
  db: PrismaDatabase,
  data: {
    email: string
    passwordHash: string
    firstName?: string
    lastName?: string
    phone?: string
  },
) {
  return db.customer.create({
    data,
    include: { addresses: true },
  })
}

export function updateCustomer(
  db: PrismaDatabase,
  id: string,
  data: Partial<{
    email: string
    passwordHash: string
    firstName: string
    lastName: string
    phone: string
    defaultAddressId: string
  }>,
) {
  return db.customer.update({
    where: { id },
    data,
    include: { addresses: true },
  })
}

export function upsertCustomer(
  db: PrismaDatabase,
  data: {
    externalId: string
    email: string
    passwordHash?: string
    firstName?: string
    lastName?: string
    phone?: string
  },
) {
  const { externalId: _externalId, passwordHash = '', ...rest } = data

  return db.customer.upsert({
    where: { email: data.email },
    create: { ...rest, passwordHash },
    update: rest,
    include: { addresses: true },
  })
}

// ---------------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------------

export function findCustomerAddresses(db: PrismaDatabase, customerId: string) {
  return db.customerAddress.findMany({
    where: { customerId },
    orderBy: [{ isDefault: 'desc' }, { id: 'asc' }],
  })
}

export function createCustomerAddress(
  db: PrismaDatabase,
  customerId: string,
  data: {
    firstName: string
    lastName: string
    phone?: string
    street: string
    street2?: string
    city: string
    state?: string
    country: string
    postalCode?: string
    district?: string
    nationalAddress?: string
    additionalNumber?: string
    isDefault?: boolean
  },
) {
  return db.customerAddress.create({
    data: { ...data, customerId },
  })
}

export function updateCustomerAddress(
  db: PrismaDatabase,
  id: string,
  data: Partial<{
    firstName: string
    lastName: string
    phone: string
    street: string
    street2: string
    city: string
    state: string
    country: string
    postalCode: string
    district: string
    isDefault: boolean
  }>,
) {
  return db.customerAddress.update({ where: { id }, data })
}

export function deleteCustomerAddress(db: PrismaDatabase, id: string) {
  return db.customerAddress.delete({ where: { id } })
}
