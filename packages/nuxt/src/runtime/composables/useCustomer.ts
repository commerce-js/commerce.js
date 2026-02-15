import { useState, computed, readonly, useRuntimeConfig } from '#imports'
import type { DeepReadonly, Ref } from 'vue'
import type { Customer, Address, RegisterInput, UpdateCustomerInput } from '@commercejs/types'
import { CommerceError, isCommerceError } from '@commercejs/types'
import { createEventHook } from '@vueuse/core'

/**
 * Customer authentication and profile composable.
 *
 * Uses server API routes (`/api/_commerce/auth/*` and `/api/_commerce/customer/*`)
 * so it works on both SSR and client-side navigation — same pattern as `useCart`.
 *
 * @example
 * ```vue
 * <script setup>
 * const { customer, isAuthenticated, login, logout, onLogin, onLogout } = useCustomer()
 *
 * onLogin((customer) => navigateTo('/account'))
 * onLogout(() => navigateTo('/'))
 * </script>
 * ```
 */
export function useCustomer() {
  const config = useRuntimeConfig()
  const apiBase = config.public.commerce?.apiBase || '/api/_commerce'

  const customer = useState<Customer | null>('commerce_customer', () => null)
  const loading = useState<boolean>('commerce_customer_loading', () => false)
  const error = useState<Error | null>('commerce_customer_error', () => null)

  // Event hooks
  const loginHook = createEventHook<Customer>()
  const logoutHook = createEventHook<void>()
  const errorHook = createEventHook<Error>()

  function handleError(err: unknown): CommerceError {
    const e = isCommerceError(err)
      ? err
      : new CommerceError(
          err instanceof Error ? err.message : String(err),
          'UNKNOWN',
          undefined,
          err,
        )
    error.value = e
    errorHook.trigger(e)
    return e
  }

  /**
   * Authenticate a customer with email and password.
   */
  async function login(email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      customer.value = await $fetch<Customer>(`${apiBase}/auth/login`, {
        method: 'POST',
        body: { email, password },
      })
      loginHook.trigger(customer.value!)
    }
    catch (err) {
      throw handleError(err)
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Register a new customer.
   */
  async function register(input: RegisterInput) {
    loading.value = true
    error.value = null
    try {
      customer.value = await $fetch<Customer>(`${apiBase}/auth/register`, {
        method: 'POST',
        body: input,
      })
      loginHook.trigger(customer.value!) // treat register as login
    }
    catch (err) {
      throw handleError(err)
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Logout the current customer.
   */
  async function logout() {
    loading.value = true
    error.value = null
    try {
      await $fetch(`${apiBase}/auth/logout`, { method: 'POST' })
      customer.value = null
      logoutHook.trigger()
    }
    catch (err) {
      throw handleError(err)
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Refresh the current customer data from the server.
   */
  async function refresh() {
    loading.value = true
    error.value = null
    try {
      customer.value = await $fetch<Customer>(`${apiBase}/customer`)
    }
    catch (err) {
      handleError(err)
      // Don't throw — customer might not be authenticated
      customer.value = null
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Update customer profile.
   */
  async function update(input: UpdateCustomerInput) {
    loading.value = true
    error.value = null
    try {
      // Use the customer endpoint — adapter.updateCustomer is called server-side
      customer.value = await $fetch<Customer>(`${apiBase}/customer`, {
        method: 'PUT',
        body: input,
      })
    }
    catch (err) {
      throw handleError(err)
    }
    finally {
      loading.value = false
    }
  }

  // ---- Password Reset ----

  /** Send a password reset email / OTP */
  async function forgotPassword(email: string) {
    loading.value = true
    error.value = null
    try {
      await $fetch(`${apiBase}/auth/forgot-password`, {
        method: 'POST',
        body: { email },
      })
    } catch (err) {
      throw handleError(err)
    } finally {
      loading.value = false
    }
  }

  /** Reset password using a token/OTP */
  async function resetPassword(token: string, newPassword: string) {
    loading.value = true
    error.value = null
    try {
      await $fetch(`${apiBase}/auth/reset-password`, {
        method: 'POST',
        body: { token, password: newPassword },
      })
    } catch (err) {
      throw handleError(err)
    } finally {
      loading.value = false
    }
  }

  // ---- Address Book ----

  /** Get all saved addresses for the authenticated customer */
  async function getAddresses(): Promise<Address[]> {
    loading.value = true
    error.value = null
    try {
      return await $fetch<Address[]>(`${apiBase}/customer/addresses`)
    } catch (err) {
      throw handleError(err)
    } finally {
      loading.value = false
    }
  }

  /** Add a new address */
  async function addAddress(address: Omit<Address, 'id'>): Promise<Address> {
    loading.value = true
    error.value = null
    try {
      const saved = await $fetch<Address>(`${apiBase}/customer/addresses`, {
        method: 'POST',
        body: address,
      })
      // Refresh customer to sync addresses list
      await refresh()
      return saved
    } catch (err) {
      throw handleError(err)
    } finally {
      loading.value = false
    }
  }

  /** Update an existing address */
  async function updateAddress(addressId: string, address: Partial<Omit<Address, 'id'>>): Promise<Address> {
    loading.value = true
    error.value = null
    try {
      const updated = await $fetch<Address>(`${apiBase}/customer/addresses/${addressId}`, {
        method: 'PUT',
        body: address,
      })
      await refresh()
      return updated
    } catch (err) {
      throw handleError(err)
    } finally {
      loading.value = false
    }
  }

  /** Delete an address */
  async function deleteAddress(addressId: string) {
    loading.value = true
    error.value = null
    try {
      await $fetch(`${apiBase}/customer/addresses/${addressId}`, {
        method: 'DELETE',
      })
      await refresh()
    } catch (err) {
      throw handleError(err)
    } finally {
      loading.value = false
    }
  }

  return {
    customer: readonly(customer) as DeepReadonly<Ref<Customer | null>>,
    isAuthenticated: computed(() => customer.value !== null),
    loading: readonly(loading),
    error: readonly(error),

    // Event hooks
    onLogin: loginHook.on,
    onLogout: logoutHook.on,
    onError: errorHook.on,

    // Methods
    login,
    register,
    logout,
    refresh,
    update,

    // Password reset
    forgotPassword,
    resetPassword,

    // Address book
    getAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
  }
}
