# Performance Test Plan: 貓爪達人投票社 (CatPawVote)

## Executive Summary

Performance testing for 500-1000 concurrent users on the Lightstreamer-based real-time voting platform. This plan covers load testing the WebSocket connections, Supabase backend, and overall system throughput.

---

## 1. Test Scope & Objectives

### 1.1 Systems Under Test
| Component | URL | Protocol |
|-----------|-----|----------|
| Frontend | `https://catpawvote.up.railway.app` | HTTPS |
| Lightstreamer | `https://lightstreamer-asia-production.up.railway.app` | WSS |
| Supabase API | `https://shblpehddhzjvhmqhxkz.supabase.co` | HTTPS |
| Supabase Auth | Same as above | HTTPS |

### 1.2 Test Objectives
1. **Concurrent Connections**: Verify 500-1000 simultaneous WebSocket connections to Lightstreamer
2. **Message Latency**: Measure real-time vote update delivery time (target: <500ms)
3. **Throughput**: Test votes per second the system can handle
4. **API Performance**: Supabase Edge Functions response times
5. **Resource Utilization**: CPU, memory, bandwidth under load
6. **Failure Points**: Identify breaking points and bottlenecks

### 1.3 Success Criteria
| Metric | Target |
|--------|--------|
| WebSocket Connection Success Rate | >99% |
| Vote Broadcast Latency (p95) | <500ms |
| API Response Time (p95) | <1000ms |
| Error Rate | <1% |
| Connection Drop Rate | <0.5% |

---

## 2. Test Scenarios

### Scenario 1: Baseline Load (500 Users)
```
- 500 concurrent WebSocket connections
- Each user subscribed to 1-3 polls
- 10% users actively voting (1 vote per 30 seconds)
- Duration: 30 minutes
- Ramp-up: 10 minutes
```

### Scenario 2: Peak Load (1000 Users)
```
- 1000 concurrent WebSocket connections
- Each user subscribed to 1-5 polls
- 20% users actively voting (1 vote per 20 seconds)
- Duration: 30 minutes
- Ramp-up: 15 minutes
```

### Scenario 3: Spike Test
```
- Start with 200 users
- Spike to 1000 users in 2 minutes
- Hold for 10 minutes
- Drop to 200 users
- Repeat 3 times
```

### Scenario 4: Endurance Test
```
- 500 concurrent users
- 8-hour continuous test
- Monitor for memory leaks, connection degradation
```

### Scenario 5: Stress Test
```
- Gradually increase from 500 to 2000 users
- Find breaking point
- Document failure mode
```

---

## 3. Recommended Testing Tools

### 3.1 Primary Tool: k6 (Recommended)

**Why k6:**
- Native WebSocket support
- JavaScript-based (familiar to your stack)
- Open source with cloud option
- Excellent metrics and reporting
- Low resource footprint

| Edition | Cost | Concurrent VUs | Features |
|---------|------|----------------|----------|
| k6 OSS | Free | Unlimited (limited by hardware) | Local execution |
| k6 Cloud Free | Free | 50 VUs | Cloud dashboard |
| k6 Cloud Team | $99/month | 1000 VUs | Distributed load |
| k6 Cloud Pro | $499/month | 10000 VUs | Advanced features |

**Recommendation**: k6 Cloud Team ($99/month) for 1000 VU testing

### 3.2 Alternative Tools Comparison

| Tool | WebSocket Support | Language | Cost | Learning Curve |
|------|-------------------|----------|------|----------------|
| **k6** | Native | JavaScript | Free/Paid | Low |
| **Artillery** | Plugin | YAML/JS | Free/Paid | Low |
| **Gatling** | Native | Scala | Free/Paid | Medium |
| **Locust** | Plugin | Python | Free | Low |
| **JMeter** | Plugin | Java/XML | Free | High |

### 3.3 Monitoring Tools

| Tool | Purpose | Cost |
|------|---------|------|
| Grafana + InfluxDB | k6 metrics visualization | Free (self-hosted) |
| Railway Metrics | Server resource monitoring | Included |
| Supabase Dashboard | Database metrics | Included |
| Lightstreamer Monitor | Connection stats | Included with license |

---

## 4. Test Scripts

### 4.1 k6 WebSocket Test Script (Lightstreamer)

```javascript
// tests/load/lightstreamer-load.js
import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';

// Custom metrics
const messageLatency = new Trend('message_latency');
const messagesReceived = new Counter('messages_received');
const connectionErrors = new Counter('connection_errors');

export const options = {
  stages: [
    { duration: '10m', target: 500 },  // Ramp up to 500 users
    { duration: '30m', target: 500 },  // Stay at 500
    { duration: '5m', target: 1000 },  // Ramp up to 1000
    { duration: '30m', target: 1000 }, // Stay at 1000
    { duration: '5m', target: 0 },     // Ramp down
  ],
  thresholds: {
    'message_latency': ['p(95)<500'],
    'connection_errors': ['count<50'],
  },
};

const LS_URL = 'wss://lightstreamer-asia-production.up.railway.app/lightstreamer';

export default function () {
  const params = { tags: { name: 'lightstreamer' } };

  const res = ws.connect(LS_URL, params, function (socket) {
    socket.on('open', () => {
      // Create session
      socket.send(JSON.stringify({
        op: 'create_session',
        data: { adapter_set: 'POLL_ADAPTER' }
      }));

      // Subscribe to polls item
      socket.send(JSON.stringify({
        op: 'subscribe',
        data: {
          item: 'polls',
          fields: ['poll_id', 'option_id', 'vote_count', 'timestamp']
        }
      }));
    });

    socket.on('message', (data) => {
      const receiveTime = Date.now();
      messagesReceived.add(1);

      try {
        const msg = JSON.parse(data);
        if (msg.timestamp) {
          const latency = receiveTime - msg.timestamp;
          messageLatency.add(latency);
        }
      } catch (e) {
        // Handle non-JSON messages
      }
    });

    socket.on('error', (e) => {
      connectionErrors.add(1);
      console.log('WebSocket error:', e);
    });

    // Keep connection alive for test duration
    socket.setTimeout(() => {
      socket.close();
    }, 60000); // 60 seconds per VU iteration
  });

  check(res, { 'WebSocket connected': (r) => r && r.status === 101 });
  sleep(1);
}
```

### 4.2 k6 Supabase API Test Script

```javascript
// tests/load/supabase-api-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const pollFetchTime = new Trend('poll_fetch_time');
const voteCastTime = new Trend('vote_cast_time');

export const options = {
  stages: [
    { duration: '5m', target: 100 },
    { duration: '20m', target: 500 },
    { duration: '5m', target: 0 },
  ],
  thresholds: {
    'poll_fetch_time': ['p(95)<1000'],
    'vote_cast_time': ['p(95)<2000'],
    'http_req_failed': ['rate<0.01'],
  },
};

const SUPABASE_URL = 'https://shblpehddhzjvhmqhxkz.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY;

const headers = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
};

export default function () {
  // Fetch polls
  const pollStart = Date.now();
  const pollRes = http.get(
    `${SUPABASE_URL}/rest/v1/polls?select=*,poll_options(*)&order=created_at.desc&limit=20`,
    { headers }
  );
  pollFetchTime.add(Date.now() - pollStart);

  check(pollRes, {
    'polls fetched': (r) => r.status === 200,
    'polls has data': (r) => r.json().length > 0,
  });

  sleep(Math.random() * 2 + 1); // 1-3 second think time

  // Simulate vote (requires auth - use test user token)
  if (__ENV.TEST_USER_TOKEN && Math.random() < 0.1) {
    const voteStart = Date.now();
    const voteRes = http.post(
      `${SUPABASE_URL}/rest/v1/rpc/cast_vote`,
      JSON.stringify({
        p_poll_id: 'test-poll-id',
        p_option_id: 'test-option-id',
      }),
      {
        headers: {
          ...headers,
          'Authorization': `Bearer ${__ENV.TEST_USER_TOKEN}`,
        },
      }
    );
    voteCastTime.add(Date.now() - voteStart);

    check(voteRes, { 'vote cast': (r) => r.status === 200 || r.status === 409 });
  }

  sleep(Math.random() * 5 + 5); // 5-10 second think time
}
```

### 4.3 Combined Test Script

```javascript
// tests/load/full-system-load.js
import { group } from 'k6';
import { wsTest } from './lightstreamer-load.js';
import { apiTest } from './supabase-api-load.js';

export const options = {
  scenarios: {
    websocket_users: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10m', target: 500 },
        { duration: '30m', target: 500 },
        { duration: '5m', target: 0 },
      ],
      exec: 'websocketScenario',
    },
    api_users: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10m', target: 100 },
        { duration: '30m', target: 100 },
        { duration: '5m', target: 0 },
      ],
      exec: 'apiScenario',
    },
  },
};

export function websocketScenario() {
  group('WebSocket', () => wsTest());
}

export function apiScenario() {
  group('API', () => apiTest());
}
```

---

## 5. Infrastructure Requirements

### 5.1 Load Generator Infrastructure

For 1000 concurrent WebSocket connections, each generator can handle ~200-300 connections.

| Option | Specs | Count | Monthly Cost |
|--------|-------|-------|--------------|
| **AWS EC2 c5.xlarge** | 4 vCPU, 8GB RAM | 4-5 instances | ~$200-250 |
| **GCP n2-standard-4** | 4 vCPU, 16GB RAM | 3-4 instances | ~$180-240 |
| **DigitalOcean CPU-Optimized** | 4 vCPU, 8GB RAM | 4-5 droplets | ~$160-200 |
| **k6 Cloud** | Managed | N/A | $99-499/month |

**Recommendation**: k6 Cloud Team ($99/month) - simplest setup, no infrastructure management

### 5.2 Target System Scaling (Railway)

Current Railway configuration may need scaling for 1000 users:

| Service | Current | Recommended for 1000 users |
|---------|---------|---------------------------|
| Frontend | 0.5 vCPU, 512MB | 1 vCPU, 1GB |
| Lightstreamer | 1 vCPU, 1GB | 2 vCPU, 4GB |

**Railway Pricing Impact:**
- Current: ~$5-20/month
- Scaled: ~$40-80/month during test

### 5.3 Supabase Plan Requirements

| Plan | Concurrent Connections | Price | Notes |
|------|------------------------|-------|-------|
| Free | 200 | $0 | Not sufficient |
| Pro | 500 | $25/month | Minimum for testing |
| Team | Unlimited | $599/month | Recommended for 1000+ |

**Current Plan Check Required**: Verify your Supabase plan supports 500+ connections

### 5.4 Lightstreamer License

| Edition | Max Connections | Price |
|---------|-----------------|-------|
| Community | 20 | Free |
| Allegro | Unlimited | Contact sales (~$2000-5000/year) |
| Presto | Unlimited + clustering | Contact sales (~$5000-15000/year) |

**Critical**: Check current Lightstreamer license. Community Edition (20 connections) will fail at scale.

---

## 6. Cost Estimate Summary

### 6.1 One-Time Test (1 Week)

| Item | Cost |
|------|------|
| k6 Cloud Team (1 month) | $99 |
| Railway scaling (1 week) | ~$20 |
| Supabase Pro (if not already) | $25 |
| **Subtotal** | **~$144** |

**Note**: Does not include Lightstreamer license if currently on Community Edition

### 6.2 Ongoing Performance Testing (Monthly)

| Item | Cost |
|------|------|
| k6 Cloud Team | $99/month |
| Railway (scaled) | $40-80/month |
| Supabase Pro | $25/month |
| **Total** | **$164-204/month** |

### 6.3 Full Production License Costs (If Needed)

| Item | Cost |
|------|------|
| Lightstreamer Allegro (annual) | ~$2,000-5,000/year |
| Supabase Team (if needed) | $599/month |
| k6 Cloud Pro (if needed) | $499/month |

---

## 7. Test Execution Plan

### Phase 1: Preparation (1-2 days)
- [ ] Verify Lightstreamer license tier
- [ ] Verify Supabase connection limits
- [ ] Set up k6 Cloud account
- [ ] Set up `scripts/load-test/` environment (.env file)
- [ ] Run `create-users.js` to create 500-1000 test users
- [ ] Run `generate-tokens.js` to generate auth tokens
- [ ] Configure monitoring dashboards
- [ ] Create isolated test polls

### Phase 2: Baseline Testing (1 day)
- [ ] Run 100-user test to establish baseline
- [ ] Verify all metrics are being captured
- [ ] Fix any script issues

### Phase 3: Load Testing (2-3 days)
- [ ] Execute Scenario 1 (500 users)
- [ ] Analyze results, identify bottlenecks
- [ ] Execute Scenario 2 (1000 users)
- [ ] Document findings

### Phase 4: Advanced Testing (1-2 days)
- [ ] Execute Scenario 3 (Spike Test)
- [ ] Execute Scenario 4 (Endurance - can run overnight)
- [ ] Execute Scenario 5 (Stress Test)

### Phase 5: Analysis & Reporting (1 day)
- [ ] Compile all results
- [ ] Identify bottlenecks and recommendations
- [ ] Create final report

**Total Duration: 6-9 days**

---

## 8. Test User Account Management

### 8.1 Overview

Load testing requires 500-1000 authenticated test users to simulate real voting behavior. These users need valid Supabase Auth accounts with auth tokens for k6 to use.

### 8.2 User Creation Strategy

**Recommended Approach**: Supabase Admin API with service role key (bypasses email verification)

| Aspect | Details |
|--------|---------|
| Email Domain | `loadtest+user{N}@catpawvote.test` |
| Password | Shared test password (e.g., `LoadTest2026!`) |
| Email Verification | Auto-confirmed via Admin API |
| Credits | Each user gets 100 貓爪幣 (default signup bonus) |

### 8.3 Scripts to Build

```
scripts/
└── load-test/
    ├── create-users.js       # Create 500-1000 test users
    ├── generate-tokens.js    # Get JWT tokens for k6
    ├── delete-users.js       # Cleanup after testing
    ├── .env.example          # Environment template
    └── .gitignore            # Ignore users.json, .env
```

### 8.4 User Creation Script

```javascript
// scripts/load-test/create-users.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // Admin access required
);

const TEST_EMAIL_DOMAIN = 'catpawvote.test';
const TEST_PASSWORD = 'LoadTest2026!';

async function createTestUsers(count = 1000) {
  console.log(`Creating ${count} test users...`);
  const users = [];
  const batchSize = 50;  // Avoid rate limits

  for (let i = 1; i <= count; i++) {
    const email = `loadtest+user${i}@${TEST_EMAIL_DOMAIN}`;

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: TEST_PASSWORD,
      email_confirm: true,  // Auto-verify, no email sent
      user_metadata: { is_test_user: true }
    });

    if (error) {
      console.error(`Failed to create user ${i}:`, error.message);
    } else {
      users.push({ id: data.user.id, email });
      console.log(`Created user ${i}/${count}: ${email}`);
    }

    // Rate limiting: pause every batch
    if (i % batchSize === 0) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // Save user list
  const fs = await import('fs');
  fs.writeFileSync('users-created.json', JSON.stringify(users, null, 2));
  console.log(`Done. Created ${users.length} users.`);
}

// Usage: node create-users.js 1000
const count = parseInt(process.argv[2]) || 1000;
createTestUsers(count);
```

### 8.5 Token Generation Script

```javascript
// scripts/load-test/generate-tokens.js
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const TEST_EMAIL_DOMAIN = 'catpawvote.test';
const TEST_PASSWORD = 'LoadTest2026!';

async function generateTokens(count = 1000) {
  console.log(`Generating tokens for ${count} users...`);
  const tokens = [];

  for (let i = 1; i <= count; i++) {
    const email = `loadtest+user${i}@${TEST_EMAIL_DOMAIN}`;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: TEST_PASSWORD,
    });

    if (error) {
      console.error(`Failed to get token for user ${i}:`, error.message);
    } else {
      tokens.push({
        email,
        access_token: data.session.access_token,
        user_id: data.user.id,
      });
    }

    // Progress indicator
    if (i % 100 === 0) {
      console.log(`Progress: ${i}/${count}`);
    }
  }

  // Save tokens for k6 (NEVER COMMIT THIS FILE)
  fs.writeFileSync('users.json', JSON.stringify(tokens, null, 2));
  console.log(`Done. Generated ${tokens.length} tokens -> users.json`);
}

const count = parseInt(process.argv[2]) || 1000;
generateTokens(count);
```

### 8.6 Cleanup Script

```javascript
// scripts/load-test/delete-users.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEST_EMAIL_DOMAIN = 'catpawvote.test';

async function deleteTestUsers() {
  // List all users with test domain
  const { data: { users }, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('Failed to list users:', error.message);
    return;
  }

  const testUsers = users.filter(u => u.email?.includes(TEST_EMAIL_DOMAIN));
  console.log(`Found ${testUsers.length} test users to delete...`);

  for (const user of testUsers) {
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) {
      console.error(`Failed to delete ${user.email}:`, error.message);
    } else {
      console.log(`Deleted: ${user.email}`);
    }
  }

  console.log('Cleanup complete.');
}

deleteTestUsers();
```

### 8.7 k6 Integration

```javascript
// tests/load/supabase-api-load.js (updated)
import http from 'k6/http';
import { SharedArray } from 'k6/data';

// Load test users from JSON file
const users = new SharedArray('users', function () {
  return JSON.parse(open('../scripts/load-test/users.json'));
});

export default function () {
  // Each VU gets a unique user
  const user = users[__VU % users.length];

  const headers = {
    'Content-Type': 'application/json',
    'apikey': __ENV.SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${user.access_token}`,
  };

  // Now cast votes as authenticated user
  // ...
}
```

### 8.8 Security Considerations

| Item | Action |
|------|--------|
| `users.json` | Add to `.gitignore` - contains tokens |
| `.env` | Add to `.gitignore` - contains service role key |
| Service Role Key | Store in local `.env` only, never commit |
| Test Domain | Use `.test` TLD (reserved, won't send real emails) |
| Cleanup | Always run delete script after testing |

### 8.9 Resource Impact

| Resource | Impact | Cleanup |
|----------|--------|---------|
| `auth.users` table | +1000 rows (~100KB) | `delete-users.js` |
| `profiles` table | +1000 rows (~50KB) | Cascade delete |
| `credit_transactions` | +1000 rows (signup bonus) | Cascade delete |
| Supabase Auth quota | Check plan limits | N/A |

### 8.10 Execution Workflow

```bash
# 1. Set up environment
cd scripts/load-test
cp .env.example .env
# Edit .env with your SUPABASE_SERVICE_ROLE_KEY

# 2. Create test users (run once before testing)
node create-users.js 1000

# 3. Generate auth tokens (tokens expire, run before each test session)
node generate-tokens.js 1000

# 4. Run k6 tests
cd ../..
k6 run tests/load/supabase-api-load.js

# 5. Cleanup after all testing complete
cd scripts/load-test
node delete-users.js
```

---

## 9. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Lightstreamer Community Edition limit | High - test will fail | Verify license before testing |
| Supabase connection limits | High - test will fail | Upgrade to Pro/Team |
| Railway auto-scaling costs | Medium - unexpected bills | Set spending limits |
| Test impacts production users | High - degraded service | Test during low-traffic hours or use staging |
| WebSocket connections exhausted | Medium | Implement connection pooling |
| Test user tokens expire | Medium - tests fail mid-run | Regenerate tokens before each session |
| Test users not cleaned up | Low - database bloat | Run cleanup script after testing |

---

## 10. Deliverables

1. **Test Scripts**: k6 scripts for all scenarios
2. **Execution Report**: Pass/fail for each test scenario
3. **Performance Metrics Report**:
   - Connection success rate
   - Message latency (p50, p95, p99)
   - Throughput (messages/second)
   - Error rates and types
   - Resource utilization graphs
4. **Bottleneck Analysis**: Identified limitations
5. **Recommendations**: Scaling and optimization suggestions

---

## 11. Prerequisites Checklist

Before starting tests, confirm:

- [ ] **Lightstreamer License**: What edition? Connection limit?
- [ ] **Supabase Plan**: Pro or Team? Connection limit?
- [ ] **Railway Budget**: Set spending alert/limit
- [ ] **Test Environment**: Use production or create staging?
- [ ] **Test Data**: Create dedicated test polls
- [ ] **Test Users**: Run `create-users.js` to create 500-1000 accounts
- [ ] **Auth Tokens**: Run `generate-tokens.js` to get JWT tokens
- [ ] **Notification**: Inform stakeholders of test schedule
- [ ] **Rollback Plan**: How to restore if tests cause issues
- [ ] **Cleanup Plan**: Schedule `delete-users.js` after testing

---

## Appendix A: Project Structure

```
quick-poll-lightstreamer/
├── src/                          # Application source
├── docs/
│   └── performance-test-plan.md  # This document
├── tests/
│   └── load/
│       ├── README.md             # Test documentation
│       ├── config.js             # URLs, thresholds, settings
│       ├── lightstreamer.test.js # WebSocket load tests
│       ├── supabase-api.test.js  # API load tests
│       └── full-system.test.js   # Combined scenarios
└── scripts/
    └── load-test/
        ├── .env.example          # Environment template
        ├── .gitignore            # Ignore users.json, .env
        ├── create-users.js       # Create test users
        ├── generate-tokens.js    # Get JWT tokens
        └── delete-users.js       # Cleanup script
```

## Appendix B: Quick Start Commands

```bash
# Install k6
brew install k6

# Set up test users (first time)
cd scripts/load-test
cp .env.example .env
# Edit .env with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
node create-users.js 500
node generate-tokens.js 500
cd ../..

# Run local test (100 VUs)
k6 run --vus 100 --duration 5m tests/load/lightstreamer.test.js

# Run with k6 Cloud
k6 cloud tests/load/lightstreamer.test.js

# Run with environment variables
k6 run -e SUPABASE_ANON_KEY=your_key tests/load/supabase-api.test.js

# Cleanup after testing
cd scripts/load-test && node delete-users.js
```

## Appendix C: Useful Monitoring Queries

```sql
-- Supabase: Active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Supabase: Slow queries during test
SELECT query, calls, mean_time, max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## Appendix D: Contact Information

| Service | Support |
|---------|---------|
| k6 | https://k6.io/docs/ |
| Lightstreamer | https://lightstreamer.com/support |
| Supabase | https://supabase.com/support |
| Railway | https://railway.app/help |

---

*Document Version: 1.1*
*Created: 2026-03-01*
*Updated: 2026-03-01*
*Project: 貓爪達人投票社 (CatPawVote)*

### Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-01 | Initial plan |
| 1.1 | 2026-03-01 | Added Section 8: Test User Account Management |
