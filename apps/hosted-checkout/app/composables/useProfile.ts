// ---------------------------------------------------------------------------
// useProfile — composable for profile lookup, OTP, and auto-fill
// ---------------------------------------------------------------------------

export function useProfile() {
  // State
  const profileId = ref<string | null>(null)
  const profileData = ref<Record<string, any> | null>(null)
  const profileExists = ref(false)
  const lookingUp = ref(false)
  const otpSent = ref(false)
  const otpVerified = ref(false)
  const otpError = ref<string | null>(null)
  const otpSending = ref(false)
  const otpVerifying = ref(false)
  const saving = ref(false)
  const saveSuccess = ref(false)
  const savedCards = ref<any[]>([])
  const selectedCard = ref<string | null>(null) // null = new card, string = saved card ID
  const tapCustomerId = computed(() => profileData.value?.preferences?.paymentProviders?.tap?.customerId || null)

  async function lookupProfile(email: string) {
    if (!email || lookingUp.value) return
    lookingUp.value = true
    otpError.value = null

    try {
      const result = await $fetch<any>('/api/profile/lookup', {
        method: 'POST',
        body: { email },
      })
      profileId.value = result.profileId
      profileExists.value = result.exists
      return result
    }
    catch (err: any) {
      console.warn('[useProfile] lookup failed:', err?.data?.message || err)
      return null
    }
    finally {
      lookingUp.value = false
    }
  }

  async function sendOtp() {
    if (!profileId.value || otpSending.value) return
    otpSending.value = true
    otpError.value = null

    try {
      await $fetch('/api/profile/otp/send', {
        method: 'POST',
        body: { profileId: profileId.value },
      })
      otpSent.value = true
    }
    catch (err: any) {
      otpError.value = err?.data?.message || 'Failed to send verification code'
    }
    finally {
      otpSending.value = false
    }
  }

  async function verifyOtp(code: string) {
    if (!profileId.value || otpVerifying.value) return false
    otpVerifying.value = true
    otpError.value = null

    try {
      const result = await $fetch<any>('/api/profile/otp/verify', {
        method: 'POST',
        body: { profileId: profileId.value, code },
      })

      if (result.verified) {
        otpVerified.value = true
        profileData.value = result.profile

        // Auto-fetch saved cards if profile has a Tap customer ID
        const hasTapCustomer = result.profile?.preferences?.paymentProviders?.tap?.customerId
        if (hasTapCustomer) {
          fetchSavedCards().catch(() => {})
        }

        return true
      }
      else {
        otpError.value = result.error || 'Invalid code'
        return false
      }
    }
    catch (err: any) {
      otpError.value = err?.data?.message || 'Verification failed'
      return false
    }
    finally {
      otpVerifying.value = false
    }
  }

  async function saveProfile(data: {
    firstName?: string
    lastName?: string
    phone?: string
    tapCustomerId?: string
    address?: Record<string, any>
    paymentMethod?: Record<string, any>
  }) {
    if (!profileId.value || saving.value) return
    saving.value = true

    try {
      const result = await $fetch<any>('/api/profile', {
        method: 'POST',
        body: { profileId: profileId.value, ...data },
      })
      profileData.value = result.profile
      saveSuccess.value = true
    }
    catch (err: any) {
      console.warn('[useProfile] save failed:', err?.data?.message || err)
    }
    finally {
      saving.value = false
    }
  }

  async function fetchSavedCards() {
    if (!profileId.value) return
    try {
      const result = await $fetch<any>('/api/profile/cards', {
        query: { profileId: profileId.value },
      })
      savedCards.value = result.cards ?? []
      // Auto-select the first saved card for one-click pay
      if (savedCards.value.length > 0) {
        selectedCard.value = savedCards.value[0].id
      }
    }
    catch (err: any) {
      console.warn('[useProfile] fetch cards failed:', err?.data?.message || err)
      savedCards.value = []
    }
  }

  async function tokenizeSavedCard(cardId: string): Promise<string | null> {
    if (!profileId.value) return null
    try {
      const result = await $fetch<any>('/api/profile/cards/tokenize', {
        method: 'POST',
        body: { profileId: profileId.value, cardId },
      })
      return result.token ?? null
    }
    catch (err: any) {
      console.warn('[useProfile] tokenize saved card failed:', err?.data?.message || err)
      return null
    }
  }

  function reset() {
    profileId.value = null
    profileData.value = null
    profileExists.value = false
    otpSent.value = false
    otpVerified.value = false
    otpError.value = null
    saveSuccess.value = false
    savedCards.value = []
    selectedCard.value = null
  }

  return {
    // State
    profileId,
    profileData,
    profileExists,
    lookingUp,
    otpSent,
    otpVerified,
    otpError,
    otpSending,
    otpVerifying,
    saving,
    saveSuccess,
    savedCards,
    selectedCard,
    tapCustomerId,
    // Actions
    lookupProfile,
    sendOtp,
    verifyOtp,
    saveProfile,
    fetchSavedCards,
    tokenizeSavedCard,
    reset,
  }
}
