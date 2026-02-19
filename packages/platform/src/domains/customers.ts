// ---------------------------------------------------------------------------
// Customers domain — registration, auth, and address book
// ---------------------------------------------------------------------------

import { hashSync, compareSync } from 'bcrypt-ts'
import type {
  Customer,
  Address,
  RegisterInput,
  UpdateCustomerInput,
} from '@commercejs/types'
import {
  findCustomerByEmail,
  findCustomerById,
  createCustomer as dbCreateCustomer,
  updateCustomer as dbUpdateCustomer,
  findAddresses,
  findAddressById,
  createAddress as dbCreateAddress,
  updateAddress as dbUpdateAddress,
  deleteAddress as dbDeleteAddress,
} from '../database/index.js'

export function createCustomersDomain() {
  /** Map DB row to Customer type */
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

  // Track current customer (per-instance state — app manages sessions)
  let currentCustomerId: string | null = null

  return {
    async login(email: string, password: string): Promise<Customer> {
      const row = await findCustomerByEmail(email)

      if (!row) throw new Error('Invalid email or password')

      const valid = compareSync(password, row.passwordHash)
      if (!valid) throw new Error('Invalid email or password')

      currentCustomerId = row.id
      return mapCustomer(row)
    },

    async register(input: RegisterInput): Promise<Customer> {
      // Check for existing email
      const existing = await findCustomerByEmail(input.email)
      if (existing) throw new Error('Email already registered')

      const id = crypto.randomUUID()
      const passwordHash = hashSync(input.password, 10)

      await dbCreateCustomer({
        id,
        email: input.email,
        passwordHash,
        firstName: input.firstName ?? null,
        lastName: input.lastName ?? null,
        phone: input.phone ?? null,
      })

      currentCustomerId = id
      const row = await findCustomerById(id)
      return mapCustomer(row)
    },

    async getCustomer(): Promise<Customer> {
      if (!currentCustomerId) throw new Error('Not authenticated')
      const row = await findCustomerById(currentCustomerId)
      if (!row) throw new Error('Customer not found')
      return mapCustomer(row)
    },

    async updateCustomer(input: UpdateCustomerInput): Promise<Customer> {
      if (!currentCustomerId) throw new Error('Not authenticated')

      const updates: any = {}
      if (input.email) updates.email = input.email
      if (input.firstName) updates.firstName = input.firstName
      if (input.lastName) updates.lastName = input.lastName
      if (input.phone) updates.phone = input.phone

      await dbUpdateCustomer(currentCustomerId, updates)
      return this.getCustomer()
    },

    async logout(): Promise<void> {
      currentCustomerId = null
    },

    async forgotPassword(_email: string): Promise<void> {
      // Stub — in a real implementation, this would send an email
    },

    async resetPassword(_token: string, _newPassword: string): Promise<void> {
      // Stub — in a real implementation, this would verify token and update password
    },

    // ---- Address Book ----

    async getAddresses(): Promise<Address[]> {
      if (!currentCustomerId) throw new Error('Not authenticated')
      const rows = await findAddresses(currentCustomerId)
      return rows.map(mapAddress)
    },

    async addAddress(address: Omit<Address, 'id'>): Promise<Address> {
      if (!currentCustomerId) throw new Error('Not authenticated')
      const id = crypto.randomUUID()

      await dbCreateAddress({
        id,
        customerId: currentCustomerId,
        firstName: address.firstName,
        lastName: address.lastName,
        phone: address.phone ?? null,
        street: address.street,
        street2: address.street2 ?? null,
        city: address.city,
        state: address.state ?? null,
        country: address.country,
        postalCode: address.postalCode ?? null,
        district: address.district ?? null,
        nationalAddress: address.nationalAddress ?? null,
        additionalNumber: address.additionalNumber ?? null,
        isDefault: address.isDefault ?? false,
      })

      // If this is the default address, update customer record
      if (address.isDefault) {
        await dbUpdateCustomer(currentCustomerId, { defaultAddressId: id })
      }

      const row = await findAddressById(id)
      return mapAddress(row)
    },

    async updateAddress(addressId: string, address: Partial<Omit<Address, 'id'>>): Promise<Address> {
      const updates: any = {}
      if (address.firstName != null) updates.firstName = address.firstName
      if (address.lastName != null) updates.lastName = address.lastName
      if (address.phone !== undefined) updates.phone = address.phone
      if (address.street != null) updates.street = address.street
      if (address.street2 !== undefined) updates.street2 = address.street2
      if (address.city != null) updates.city = address.city
      if (address.state !== undefined) updates.state = address.state
      if (address.country != null) updates.country = address.country
      if (address.postalCode !== undefined) updates.postalCode = address.postalCode
      if (address.district !== undefined) updates.district = address.district
      if (address.isDefault != null) updates.isDefault = address.isDefault

      await dbUpdateAddress(addressId, updates)

      const row = await findAddressById(addressId)
      return mapAddress(row)
    },

    async deleteAddress(addressId: string): Promise<void> {
      await dbDeleteAddress(addressId)
    },

    /** Set the current customer ID (for adapter-level auth management) */
    setCurrentCustomer(id: string | null) {
      currentCustomerId = id
    },
  }
}
