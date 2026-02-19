// ---------------------------------------------------------------------------
// Prisma: Customer queries
// ---------------------------------------------------------------------------

import { getDb } from '../client.js'

export async function findCustomerByEmail(email: string) {
  return getDb().customer.findUnique({ where: { email } })
}

export async function findCustomerById(id: string) {
  return getDb().customer.findUnique({ where: { id } })
}

export async function createCustomer(data: {
  id: string
  email: string
  passwordHash: string
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
}) {
  await getDb().customer.create({ data })
}

export async function updateCustomer(id: string, data: Record<string, any>) {
  await getDb().customer.update({ where: { id }, data })
}

export async function findAddresses(customerId: string) {
  return getDb().customerAddress.findMany({ where: { customerId } })
}

export async function findAddressById(addressId: string) {
  return getDb().customerAddress.findUnique({ where: { id: addressId } })
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
  await getDb().customerAddress.create({ data })
}

export async function updateAddress(addressId: string, data: Record<string, any>) {
  await getDb().customerAddress.update({ where: { id: addressId }, data })
}

export async function deleteAddress(addressId: string) {
  await getDb().customerAddress.delete({ where: { id: addressId } })
}
