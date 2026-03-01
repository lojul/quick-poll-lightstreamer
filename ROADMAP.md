# Roadmap & Improvement Suggestions

## Priority: High

### 1. Performance & Scalability
- [ ] **Database indexing** - Add indexes on `polls.last_voted_at`, `votes.voter_id` for faster queries
- [ ] **Pagination** - Implement infinite scroll or pagination for polls (currently loads all)
- [ ] **CDN for static assets** - Use Cloudflare or similar for faster global delivery

### 2. User Experience
- [x] ~~**Share poll link**~~ - ✅ Done (v1.4.0)
- [ ] **Poll search** - Search by question text or creator
- [x] ~~**My polls page**~~ - ✅ Done (v1.4.0)
- [x] ~~**Delete own polls**~~ - ✅ Done (v1.4.0)

### 3. Security
- [ ] **Login rate limiting** - Prevent brute force password attacks (5 attempts per minute)
- [ ] **CAPTCHA on signup** - Prevent bot account creation
- [ ] **Email verification required** - Enforce before voting (currently optional)

> **Note:** Rate limiting for voting/polls NOT needed - the credit system (貓爪幣) naturally prevents spam since each action costs credits.

## Priority: Medium

### 4. Monetization
- [ ] **Premium features** - Extended deadlines, more options per poll, analytics
- [ ] **Ad-free subscription** - Monthly plan for power users
- [ ] **Bulk credit packages** - HK$100+ tiers for heavy users

### 5. Analytics & Insights
- [ ] **Poll creator dashboard** - Vote breakdown over time, demographics
- [ ] **Admin dashboard** - Total users, revenue, active polls
- [ ] **Export results** - CSV/Excel download for poll results

### 6. Social Features
- [ ] **Comments on polls** - Discussion below results
- [ ] **Follow creators** - Get notified when they create new polls
- [ ] **Embed widget** - Embed polls on external websites

## Priority: Low (Nice to Have)

### 7. Advanced Poll Types
- [ ] **Multiple choice** - Select 2-3 options
- [ ] **Ranked choice** - Drag to rank preferences
- [ ] **Image options** - Upload images as poll choices
- [ ] **Anonymous polls** - Hidden voter identity

### 8. Localization
- [ ] **English UI toggle** - Full bilingual support
- [ ] **Multi-currency** - USD, TWD in addition to HKD

### 9. Technical Debt
- [ ] **Unit tests** - Add Jest/Vitest tests for hooks and components
- [ ] **E2E tests** - Playwright tests for critical flows
- [ ] **Error boundary** - Graceful error handling with retry
- [ ] **Sentry integration** - Error monitoring in production

## Completed

### v1.4.0 (2026-03-01)
- [x] Optimistic vote counts (instant UI feedback)
- [x] Forgot password flow
- [x] Android text layout fix
- [x] Payment history loading fix
- [x] Share poll link (copy to clipboard)
- [x] My Polls page (`/my-polls`)
- [x] Delete own polls with confirmation

### v1.3.0 (2026-02-28)
- [x] Real-time sorting with Lightstreamer
- [x] Tiered sorting algorithm
- [x] Expired polls page
- [x] Deadline support

### v1.2.0 (2026-02-27)
- [x] Credit system (貓爪幣)
- [x] Stripe payments (HKD)
- [x] WeChat Pay & Alipay
- [x] Payment history

## Notes
- Lightstreamer is already optimized for 500-1000 concurrent users
- Credit system acts as natural rate limiter for paid actions
- Consider load testing before major launch (see `docs/performance-test-plan.md`)
