# Lightstreamer Server for Quick-Poll

Real-time vote streaming server using Lightstreamer with a custom Node.js data adapter.

## Architecture

```
┌─────────────────────────────────────────┐
│         Lightstreamer Server            │
│  ┌───────────────────────────────────┐  │
│  │      Poll Vote Data Adapter       │  │
│  │  (Node.js - subscribes to         │  │
│  │   Supabase real-time changes)     │  │
│  └───────────────────────────────────┘  │
└──────────────┬──────────────────────────┘
               │ WebSocket
               ▼
        React Application
```

## Local Development

### Prerequisites

- Docker & Docker Compose
- Supabase service role key (for server-side access)

### Setup

1. Copy environment file:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Supabase credentials in `.env`:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_KEY=your-service-role-key
   ```

3. Start the server:
   ```bash
   docker-compose up --build
   ```

4. The Lightstreamer server will be available at `http://localhost:8080`

## Deploy to Railway

### Option 1: Railway CLI

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login and initialize:
   ```bash
   cd lightstreamer-server
   railway login
   railway init
   ```

3. Set environment variables:
   ```bash
   railway variables set SUPABASE_URL=https://your-project.supabase.co
   railway variables set SUPABASE_SERVICE_KEY=your-service-role-key
   ```

4. Deploy:
   ```bash
   railway up
   ```

### Option 2: Railway Dashboard

1. Create a new project in Railway
2. Connect your GitHub repository
3. Set the root directory to `lightstreamer-server`
4. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
5. Deploy

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (server-side) |
| `LS_REQUEST_PORT` | Adapter request port (default: 6661) |
| `LS_NOTIFY_PORT` | Adapter notify port (default: 6662) |

### Lightstreamer License

The demo license supports **20 concurrent connections**, which is sufficient for development and small-scale deployments.

For production use with more connections, you'll need a commercial license from [Lightstreamer](https://lightstreamer.com/).

## Testing

1. Start the Lightstreamer server
2. Update the React app's `.env` with your Lightstreamer URL:
   ```
   VITE_LIGHTSTREAMER_URL=http://localhost:8080
   ```
3. Open multiple browser tabs
4. Cast votes and verify real-time updates

## Troubleshooting

### Adapter connection issues

Check that the adapter ports (6661/6662) are correctly configured in both:
- `adapters.xml` (Lightstreamer config)
- Adapter environment variables

### Supabase connection issues

Verify your service key has the correct permissions to:
- Read from `poll_options` table
- Subscribe to real-time changes

### WebSocket connection issues

Ensure your deployment allows WebSocket connections:
- Railway: WebSockets are supported by default
- Custom deployments: May need reverse proxy configuration
