// ---------------------------------------------------------------------------
// Drizzle: Customer queries
// ---------------------------------------------------------------------------

import { eq } from 'drizzle-orm'
import { getDb } from '../client.js'
import * as schema from '../schema/index.js'

export async function findCustomerByEmail(email: string) {
  const [row] = await getDb().select().from(schema.customers).where(eq(schema.customers.email, email))
  return row ?? null
}

export async function findCustomerById(id: string) {
  const [row] = await getDb().select().from(schema.customers).where(eq(schema.customers.id, id))
  return row ?? null
}

export async function createCustomer(data: {
  id: string
  email: string
  passwordHash: string
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  createdAt?: string | Date
  updatedAt?: string | Date
}) {
  await getDb().insert(schema.customers).values(data as any)
}

export async function updateCustomer(id: string, data: Record<string, any>) {
  await getDb().update(schema.customers).set(data as any).where(eq(schema.customers.id, id))
}

export async function findAddresses(customerId: string) {
  return getDb().select().from(schema.customerAddresses)
    .where(eq(schema.customerAddresses.customerId, customerId))
}

export async function findAddressById(addressId: string) {
  const [row] = await getDb().select().from(schema.customerAddresses)
    .where(eq(schema.customerAddresses.id, addressId))
  return row ?? null
}

export async function createAddress(data: {
  id: string
  customerId: string
  firstName: string
  lastName: string
  phone?: string | null
  street: string
  street2?: string | null
  city: string
  state?: string | null
  country: string
  postalCode?: string | null
  district?: string | null
  nationalAddress?: string | null
  additionalNumber?: string | null
  isDefault?: boolean
}) {
  await getDb().insert(schema.customerAddresses).values(data as any)
}

export async function updateAddress(addressId: string, data: Record<string, any>) {
  await getDb().update(schema.customerAddresses).set(data as any)
    .where(eq(schema.customerAddresses.id, addressId))
}

export async function deleteAddress(addressId: string) {
  await getDb().delete(schema.customerAddresses)
    .where(eq(schema.customerAddresses.id, addressId))
}
