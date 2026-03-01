# Roadmap & Improvement Suggestions

## Priority: High

### 1. Performance & Scalability
- [ ] **Database indexing** - Add indexes on `polls.last_voted_at`, `votes.voter_id` for faster queries
- [ ] **Pagination** - Implement infinite scroll or pagination for polls (currently loads all)
- [ ] **CDN for static assets** - Use Cloudflare or similar for faster global delivery

### 2. User Experience
- [ ] **Share poll link** - Add copy-to-clipboard button for sharing specific polls
- [ ] **Poll search** - Search by question text or creator
- [ ] **My polls page** - Users can view/manage polls they created
- [ ] **Delete own polls** - Allow creators to delete their polls (before votes or with confirmation)

### 3. Security
- [ ] **Rate limiting** - Prevent spam poll creation and rapid voting attempts
- [ ] **CAPTCHA** - Add on signup to prevent bot accounts
- [ ] **Email verification required** - Enforce before voting (currently optional)

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

## Completed (v1.4.0)
- [x] Optimistic vote counts
- [x] Forgot password flow
- [x] Android text layout fix
- [x] Payment history loading fix

## Notes
- Lightstreamer is already optimized for 500-1000 concurrent users
- Consider load testing before major launch (see `docs/performance-test-plan.md`)
