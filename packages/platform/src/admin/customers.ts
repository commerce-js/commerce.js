// ---------------------------------------------------------------------------
// Admin: Customer management
// ---------------------------------------------------------------------------

import type { Customer, Address, PaginatedResult } from '@commercejs/types'
import type { AdminListParams } from './types.js'
import {
  findCustomerById,
  findAddresses,
  findAllCustomers,
  deleteCustomerById,
} from '../database/index.js'

function mapAddress(row: any): Address {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone ?? null,
    street: row.street,
    street2: row.street2 ?? null,
    city: row.city,
    state: row.state ?? null,
    country: row.country,
    postalCode: row.postalCode ?? null,
    district: row.district ?? null,
    nationalAddress: row.nationalAddress ?? null,
    additionalNumber: row.additionalNumber ?? null,
    isDefault: Boolean(row.isDefault),
  }
}

async function mapCustomer(row: any): Promise<Customer> {
  const addresses = await findAddresses(row.id)

  return {
    id: row.id,
    email: row.email,
    firstName: row.firstName ?? null,
    lastName: row.lastName ?? null,
    phone: row.phone ?? null,
    addresses: addresses.map(mapAddress),
    defaultAddressId: row.defaultAddressId ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function createAdminCustomersDomain() {
  return {
    async listCustomers(params?: AdminListParams): Promise<PaginatedResult<Customer>> {
      const page = params?.page ?? 1
      const perPage = params?.perPage ?? 20
      const offset = (page - 1) * perPage

      const { rows, total } = await findAllCustomers({
        search: params?.search,
        limit: perPage,
        offset,
      })

      const customers = await Promise.all(rows.map(mapCustomer))

      return {
        items: customers,
        total,
        page,
        perPage,
        hasMore: offset + perPage < total,
      }
    },

    async getCustomer(id: string): Promise<Customer> {
      const row = await findCustomerById(id)
      if (!row) throw new Error(`Customer not found: ${id}`)
      return mapCustomer(row)
    },

    async deleteCustomer(id: string): Promise<void> {
      const row = await findCustomerById(id)
      if (!row) throw new Error(`Customer not found: ${id}`)
      await deleteCustomerById(id)
    },
  }
}
