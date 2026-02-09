// ---------------------------------------------------------------------------
// Auction / bidding types
// ---------------------------------------------------------------------------

import type { Id, Maybe, Price } from './common.js'

/** Type of auction */
export type AuctionType =
  | 'english'     // Ascending — highest bid wins
  | 'dutch'       // Descending — price drops until someone buys
  | 'sealed'      // Sealed bid — blind, highest wins
  | 'reverse'     // Reverse — lowest bid wins (for procurement)

/** Auction lifecycle status */
export type AuctionStatus =
  | 'upcoming'    // Not yet started
  | 'active'      // Currently accepting bids
  | 'ended'       // Bidding period closed
  | 'sold'        // Winner confirmed and order placed
  | 'cancelled'   // Auction was cancelled
  | 'reserve_not_met'  // Ended but reserve price wasn't met

/** Auction metadata on a product */
export interface AuctionProductMeta {
  /** Type of auction */
  auctionType: AuctionType
  status: AuctionStatus
  /** Starting / opening price */
  startingPrice: Price
  /** Reserve price — minimum to sell (null = no reserve) */
  reservePrice: Maybe<Price>
  /** Minimum bid increment */
  bidIncrement: Price
  /** Buy-it-now price — skip the auction (null = no buy-it-now) */
  buyNowPrice: Maybe<Price>
  /** Auction start time (ISO 8601) */
  startsAt: string
  /** Auction end time (ISO 8601) */
  endsAt: string
  /** Current highest bid (null if no bids yet) */
  currentBid: Maybe<Price>
  /** Total number of bids placed */
  bidCount: number
  /** Whether auto-bidding (proxy bidding) is allowed */
  autoBiddingEnabled: boolean
  /** ID of the current winning bidder (null if no bids) */
  winningBidderId: Maybe<Id>
}

/** A single bid placed by a customer */
export interface Bid {
  id: Id
  /** Product / auction ID */
  productId: Id
  /** Bidder customer ID */
  bidderId: Id
  /** Bidder display name */
  bidderName: string
  /** Bid amount */
  amount: Price
  /** Maximum amount for auto-bidding (null if not auto-bidding) */
  maxAutoBid: Maybe<Price>
  /** Whether this is currently the winning bid */
  isWinning: boolean
  /** Whether this was an auto-bid placed by the system */
  isAutoBid: boolean
  createdAt: string
}

/** Input for placing a bid */
export interface PlaceBidInput {
  productId: string
  /** Bid amount */
  amount: number
  /** Maximum auto-bid amount (optional — enables proxy bidding) */
  maxAutoBid?: number
}
