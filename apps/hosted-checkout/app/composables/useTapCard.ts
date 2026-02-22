/**
 * useTapCard — Tap Card SDK v2 composable
 *
 * Loads `https://tap-sdks.b-cdn.net/card/1.0.2/index.js`,
 * renders the card element, and exposes `tokenize()`.
 *
 * @see https://developers.tap.company/docs/card-sdk-web-v2
 */

export interface TapCardOptions {
  /** DOM element ID to mount the card into */
  containerId: string
  /** Tap public key */
  publicKey: string
  /** Transaction amount */
  amount: number
  /** Transaction currency (e.g. 'BHD', 'SAR') */
  currency: string
  /** Customer email */
  email?: string
  /** Customer first name */
  firstName?: string
  /** Customer last name */
  lastName?: string
  /** Customer phone (e.g. '+97330000000') */
  phone?: string
  /** Show "Save card for later" checkbox */
  saveCard?: boolean
  /** Tap customer ID — required for saveCard addon to render */
  customerId?: string
  /** Merchant ID (optional, defaults to Tap account merchant) */
  merchantId?: string
}

export function useTapCard() {
  const ready = ref(false)
  const error = ref<string | null>(null)
  const tokenData = ref<any>(null)
  const saveCardSelected = ref(false)

  let _unmount: (() => void) | null = null

  /** Load the Card SDK v2 script */
  function loadSDK(): Promise<void> {
    if (typeof window === 'undefined') return Promise.resolve()
    if ((window as any).CardSDK) return Promise.resolve()

    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[src*="tap-sdks.b-cdn.net/card"]')
      if (existing) {
        existing.addEventListener('load', () => resolve())
        if ((window as any).CardSDK) resolve()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://tap-sdks.b-cdn.net/card/1.0.2/index.js'
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Tap Card SDK v2'))
      document.head.appendChild(script)
    })
  }

  /** Render the card element into the container */
  function render(options: TapCardOptions) {
    const CardSDK = (window as any).CardSDK
    if (!CardSDK) {
      error.value = 'Card SDK not loaded'
      return
    }

    const { renderTapCard, Theme, Currencies, Direction, Edges, Locale } = CardSDK

    // Map currency string to SDK enum or fall back to string
    const sdkCurrency = (Currencies as Record<string, any>)?.[options.currency] || options.currency

    const config: Record<string, any> = {
      publicKey: options.publicKey,
      transaction: {
        amount: options.amount,
        currency: sdkCurrency,
      },
      acceptance: {
        supportedBrands: ['AMERICAN_EXPRESS', 'VISA', 'MASTERCARD', 'MADA'],
        supportedCards: 'ALL',
      },
      fields: {
        cardHolder: true,
      },
      addons: {
        displayPaymentBrands: true,
        loader: true,
        saveCard: options.saveCard ?? false,
      },
      interface: {
        locale: Locale.EN,
        theme: Theme.LIGHT,
        edges: Edges.CURVED,
        direction: Direction.LTR,
      },
      onReady: () => {
        ready.value = true
      },
      onError: (data: any) => {
        console.error('[TapCard] onError:', data)
        error.value = data?.error?.message || 'Card input error. Please check your details.'
      },
      onSuccess: (data: any) => {
        console.log('[TapCard] onSuccess:', JSON.stringify(data))
        tokenData.value = data
      },
      onChangeSaveCardLater: (isSelected: boolean) => {
        saveCardSelected.value = isSelected
      },
      onFocus: () => {},
      onBinIdentification: () => {},
      onValidInput: () => {},
      onInvalidInput: () => {
        // Reset ready if input becomes invalid (optional UX)
      },
    }

    // Add customer info if available
    if (options.email || options.firstName || options.phone || options.customerId) {
      const customerConfig: Record<string, any> = {
        name: [
          {
            lang: Locale.EN,
            first: options.firstName || '',
            last: options.lastName || '',
            middle: '',
          },
        ],
        nameOnCard: [options.firstName, options.lastName].filter(Boolean).join(' ') || '',
        editable: true,
        contact: {
          email: options.email || '',
          phone: {
            countryCode: '973',
            number: options.phone?.replace(/^\+?\d{1,3}/, '') || '',
          },
        },
      }

      // Only set customer.id if it's a real Tap customer ID (cus_xxx)
      if (options.customerId?.startsWith('cus_')) {
        customerConfig.id = options.customerId
      }

      config.customer = customerConfig
    }

    // Add merchant if provided
    if (options.merchantId) {
      config.merchant = { id: options.merchantId }
    }

    const result = renderTapCard(options.containerId, config)
    _unmount = result?.unmount || null
  }

  /** Tokenize the current card input */
  function tokenize(): Promise<any> {
    return new Promise((resolve, reject) => {
      const CardSDK = (window as any).CardSDK
      if (!CardSDK) {
        reject(new Error('Card SDK not loaded'))
        return
      }

      // Watch for token via the onSuccess callback
      const unwatch = watch(tokenData, (data) => {
        if (data?.id) {
          unwatch()
          resolve(data)
        }
      })

      // Also watch for errors
      const unwatchError = watch(error, (err) => {
        if (err) {
          unwatch()
          unwatchError()
          reject(new Error(err))
        }
      })

      // Reset previous token data
      tokenData.value = null
      error.value = null

      // Trigger tokenization
      CardSDK.tokenize()

      // Timeout after 30s
      setTimeout(() => {
        unwatch()
        unwatchError()
        if (!tokenData.value) {
          reject(new Error('Tokenization timed out'))
        }
      }, 30000)
    })
  }

  /** Unmount the card element */
  function unmount() {
    if (_unmount) {
      _unmount()
      _unmount = null
    }
    ready.value = false
    tokenData.value = null
    error.value = null
  }

  return {
    ready,
    error,
    tokenData,
    saveCardSelected,
    loadSDK,
    render,
    tokenize,
    unmount,
  }
}
