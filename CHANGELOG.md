# Changelog

All notable changes to 貓爪達人投票社 (CatPawVote) are documented here.

## [1.3.0] - 2026-02-28

### Added
- **Real-time sorting with Lightstreamer** - Polls re-sort every 2 seconds based on live vote activity
- **Tiered sorting algorithm**:
  - Slots 1-2: Recently voted polls (>5 votes) for "live" feel
  - Slots 3-10: Most voted (trending)
  - Slots 11-20: Composite score
  - Slots 21+: Votes DESC
- **`last_voted_at` tracking** - Database trigger updates timestamp on each vote
- **Character limits** - 45 chars for text, 16 digits for numbers
- **Expired polls page** (`/expired`) - Separate archive for ended polls
- **Deadline display** - Clock icon with countdown on active polls

### Changed
- **Rebranded** from "快速投票/Quick Polls" to "貓爪達人投票社/CatPawVote"
- **Token renamed** from "閃幣" to "貓爪幣"
- **New logo** - Purple cat paw with "VOTE" text
- **Theme color** - Changed to purple (#9333ea)
- **Visitor timeout** - Increased from 60s to 3600s (1 hour)

### Fixed
- **Duplicate vote prevention** - Unique constraint + optimistic UI lock
- **Deadline not saving** - Now properly saved when creating polls
- **Balance box removed** - Removed non-working balance from payment success page

## [1.2.0] - 2026-02-27

### Added
- **Credit system (閃幣)** - 100 free on signup
- **Stripe payments** - HK$4/18/38 packages
- **Payment history** - Fetches from Stripe PaymentIntents
- **WeChat Pay & Alipay** - HKD payment methods
- **Vote flash effect** - Yellow highlight via Lightstreamer
- **Heartbeat indicator** - Green pulsing dot for connection status

### Changed
- **Registered users only voting** - Database-based vote tracking
- **Vote status clears on logout** - Guests see all as "not yet voted"

### Fixed
- **Credit calculation** - Fixed race condition with atomic updates
- **Concurrent visitor count** - Fixed by polling connection status
- **SPA routing** - Added serve.json for Railway

## [1.1.0] - 2026-02-26

### Added
- **Lightstreamer integration** - Real-time vote streaming
- **Concurrent visitor tracking** - Live user count
- **Real-time connection indicator**

## [1.0.0] - 2026-02-25

### Added
- Initial release
- Poll creation and voting
- Supabase backend
- Basic authentication
