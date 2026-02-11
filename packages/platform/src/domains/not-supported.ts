// ---------------------------------------------------------------------------
// NOT_SUPPORTED stubs — domains not yet implemented
// ---------------------------------------------------------------------------
// These throw CommerceError with code NOT_SUPPORTED (HTTP 501).
// They'll be replaced with real implementations in future phases.
// ---------------------------------------------------------------------------

function notSupported(domain: string, method: string): never {
  const error = new Error(`${domain}.${method} is not supported by @commercejs/platform yet`)
  ;(error as any).code = 'NOT_SUPPORTED'
  ;(error as any).statusCode = 501
  throw error
}

export const wholesaleStubs = {
  getCustomerGroups: () => notSupported('wholesale', 'getCustomerGroups'),
  createQuote: () => notSupported('wholesale', 'createQuote'),
  getQuotes: () => notSupported('wholesale', 'getQuotes'),
  getQuote: () => notSupported('wholesale', 'getQuote'),
  acceptQuote: () => notSupported('wholesale', 'acceptQuote'),
  rejectQuote: () => notSupported('wholesale', 'rejectQuote'),
}

export const auctionStubs = {
  placeBid: () => notSupported('auctions', 'placeBid'),
  getBids: () => notSupported('auctions', 'getBids'),
  getWinningBid: () => notSupported('auctions', 'getWinningBid'),
}

export const rentalStubs = {
  checkAvailability: () => notSupported('rentals', 'checkAvailability'),
  createBooking: () => notSupported('rentals', 'createBooking'),
  getBookings: () => notSupported('rentals', 'getBookings'),
  getBooking: () => notSupported('rentals', 'getBooking'),
  cancelBooking: () => notSupported('rentals', 'cancelBooking'),
}

export const giftCardStubs = {
  purchaseGiftCard: () => notSupported('gift-cards', 'purchaseGiftCard'),
  getGiftCardBalance: () => notSupported('gift-cards', 'getGiftCardBalance'),
  redeemGiftCard: () => notSupported('gift-cards', 'redeemGiftCard'),
  getMyGiftCards: () => notSupported('gift-cards', 'getMyGiftCards'),
  getGiftCardTransactions: () => notSupported('gift-cards', 'getGiftCardTransactions'),
}

export const locationStubs = {
  getStoreLocations: () => notSupported('locations', 'getStoreLocations'),
}
