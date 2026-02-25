# Lightstreamer Server with Node.js Remote Adapter
# Build timestamp: 2026-02-25-v9

# Stage 1: Build Node.js adapter
FROM alpine:latest AS builder

RUN apk add --no-cache nodejs npm

WORKDIR /build/node-adapter

# Create package.json
RUN echo '{"name":"poll-adapter","version":"1.0.0","type":"module","dependencies":{"lightstreamer-adapter":"^1.7.0","@supabase/supabase-js":"^2.57.4"}}' > package.json

# Create adapter code
COPY adapters/poll-adapter/index.js index.js

# Install dependencies
RUN npm install --production

# Stage 2: Final Lightstreamer server
FROM lightstreamer:latest

USER root

# Install Node.js
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl ca-certificates && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create adapter directory
RUN mkdir -p /lightstreamer/adapters/poll-adapter

# Copy adapter config
COPY adapters.xml /lightstreamer/adapters/poll-adapter/adapters.xml

# Copy Node.js adapter
COPY --from=builder /build/node-adapter /lightstreamer/adapters/poll-adapter/node-adapter

# Create startup script - Start Lightstreamer first, then Node.js adapter connects to it
RUN printf '#!/bin/bash\n\
set -e\n\
export LS_HOME=/lightstreamer\n\
cd $LS_HOME\n\
echo "[Startup] Starting Lightstreamer server from $LS_HOME..."\n\
$LS_HOME/bin/unix-like/LS.sh run &\n\
LS_PID=$!\n\
echo "[Startup] Waiting for Lightstreamer to initialize (PID: $LS_PID)..."\n\
sleep 15\n\
echo "[Startup] Starting Node.js adapter..."\n\
cd $LS_HOME/adapters/poll-adapter/node-adapter\n\
node index.js &\n\
ADAPTER_PID=$!\n\
echo "[Startup] All services started. Lightstreamer PID: $LS_PID, Adapter PID: $ADAPTER_PID"\n\
wait $LS_PID\n\
' > /lightstreamer/start.sh && chmod +x /lightstreamer/start.sh

# Set ownership
RUN chown -R lightstreamer:lightstreamer /lightstreamer/adapters /lightstreamer/start.sh

USER lightstreamer
WORKDIR /lightstreamer

EXPOSE 8080

CMD ["/lightstreamer/start.sh"]
