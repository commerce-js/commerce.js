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

  function reset() {
    profileId.value = null
    profileData.value = null
    profileExists.value = false
    otpSent.value = false
    otpVerified.value = false
    otpError.value = null
    saveSuccess.value = false
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
    // Actions
    lookupProfile,
    sendOtp,
    verifyOtp,
    saveProfile,
    reset,
  }
}
