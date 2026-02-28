/**
 * Lightstreamer Data Adapter for Poll Vote Streaming
 *
 * Architecture:
 * - Frontend votes → Supabase DB (direct write)
 * - Adapter polls Supabase every 500ms to detect changes
 * - Adapter pushes updates via Lightstreamer to ALL connected clients
 * - NO dependency on Supabase Realtime (unreliable server-side)
 *
 * Features:
 * 1. Real-time vote streaming via Lightstreamer
 * 2. Concurrent visitor tracking
 * 3. 500ms polling for reliable change detection
 */

import { DataProvider } from "lightstreamer-adapter";
import { createClient } from "@supabase/supabase-js";
import * as net from "net";

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const LS_HOST = process.env.LS_HOST || "localhost";
const LS_PORT = parseInt(process.env.LS_PORT || "6661");

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_KEY");
  process.exit(1);
}

// Initialize Supabase client with service key for server-side access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Track subscribed items
const subscribedItems = new Map(); // itemName -> { optionId, isActive }

// Current vote counts cache
const voteCounts = new Map(); // optionId -> vote_count

// Track concurrent visitors with timestamps for timeout cleanup
const visitorItems = new Map(); // itemName -> { lastSeen: timestamp }
const VISITOR_COUNT_ITEM = "visitors_count";
const VISITOR_TIMEOUT_MS = 3600000; // 3600 seconds (1 hour) timeout
const VISITOR_CLEANUP_INTERVAL_MS = 15000; // Check every 15 seconds

// Data provider instance
let dataProvider = null;

/**
 * Initialize the Lightstreamer Data Provider
 */
function initDataProvider() {
  return new Promise((resolve, reject) => {
    console.log(`[Adapter] Connecting to Lightstreamer at ${LS_HOST}:${LS_PORT}`);

    // Create single TCP connection to Lightstreamer server
    const stream = net.createConnection(LS_PORT, LS_HOST);

    stream.on("connect", () => {
      console.log(`[Adapter] Connected to Lightstreamer`);
      setupDataProvider();
    });

    stream.on("error", (err) => {
      console.error(`[Adapter] Connection error:`, err.message);
      reject(err);
    });

    function setupDataProvider() {
      // Single stream mode - no options object
      dataProvider = new DataProvider(stream);

      // Set snapshot availability handler
      dataProvider.on("isSnapshotAvailable", (itemName, callback) => {
        callback(
          itemName.startsWith("option_") ||
          itemName.startsWith("visitor_") ||
          itemName === VISITOR_COUNT_ITEM
        );
      });

      // Handle subscription requests
      dataProvider.on("subscribe", async (itemName, response) => {
        // Handle individual visitor subscription (visitor_<uuid>)
        if (itemName.startsWith("visitor_")) {
          subscribedItems.set(itemName, { isActive: true, isVisitorItem: true });
          visitorItems.set(itemName, { lastSeen: Date.now() });
          response.success();

          // Send snapshot (just a ping acknowledgment)
          dataProvider.update(itemName, true, { ping: "1" });

          // Broadcast updated count to all visitors_count subscribers
          broadcastVisitorCount();
          console.log(`[Adapter] Visitor connected: ${itemName}. Total: ${visitorItems.size}`);
          return;
        }

        // Handle visitor count subscription (to receive total count)
        if (itemName === VISITOR_COUNT_ITEM) {
          subscribedItems.set(itemName, { isActive: true, isCountItem: true });
          response.success();

          // Send snapshot with current visitor count
          dataProvider.update(VISITOR_COUNT_ITEM, true, {
            count: String(visitorItems.size),
          });
          console.log(`[Adapter] Visitor count subscription. Current: ${visitorItems.size}`);
          return;
        }

        if (!itemName.startsWith("option_")) {
          response.error("Invalid item name. Expected format: option_<uuid>, visitor_<uuid>, or 'visitors_count'");
          return;
        }

        const optionId = itemName.replace("option_", "");

        // Track subscription
        subscribedItems.set(itemName, { optionId, isActive: true });

        // Fetch current vote count from database
        try {
          const { data, error } = await supabase
            .from("poll_options")
            .select("vote_count")
            .eq("id", optionId)
            .single();

          if (error) {
            console.error(`[Adapter] Error fetching vote count for ${optionId}:`, error);
            response.error("Failed to fetch vote count");
            return;
          }

          const voteCount = data?.vote_count || 0;
          voteCounts.set(optionId, voteCount);

          // Success - subscription accepted
          response.success();

          // Send snapshot
          dataProvider.update(itemName, true, {
            vote_count: String(voteCount),
          });

          // Subscription successful (logged at debug level only)
        } catch (err) {
          console.error(`[Adapter] Exception subscribing to ${itemName}:`, err);
          response.error("Internal error");
        }
      });

      // Handle unsubscription
      dataProvider.on("unsubscribe", (itemName, response) => {
        if (subscribedItems.has(itemName)) {
          const item = subscribedItems.get(itemName);
          subscribedItems.delete(itemName);

          // Remove from visitor tracking if this was a visitor subscription
          if (item?.isVisitorItem) {
            visitorItems.delete(itemName);
            broadcastVisitorCount();
            console.log(`[Adapter] Visitor disconnected: ${itemName}. Total: ${visitorItems.size}`);
          }
        }

        response.success();
      });

      // Handle errors
      dataProvider.on("error", (err) => {
        console.error("[Adapter] Data provider error:", err);
      });

      console.log(`[Adapter] Data provider initialized successfully`);
      resolve(dataProvider);
    }
  });
}

/**
 * Broadcast visitor count to all subscribed clients
 */
function broadcastVisitorCount() {
  if (!dataProvider) return;

  // Only broadcast if someone is subscribed to visitors_count
  if (subscribedItems.has(VISITOR_COUNT_ITEM)) {
    try {
      dataProvider.update(VISITOR_COUNT_ITEM, false, {
        count: String(visitorItems.size),
      });
    } catch (err) {
      // Ignore errors if item not subscribed
    }
  }
}

/**
 * Clean up stale visitors that have timed out
 * Removes visitors that haven't been seen within VISITOR_TIMEOUT_MS
 */
let visitorCleanupInterval = null;

function startVisitorCleanup() {
  if (visitorCleanupInterval) return;

  visitorCleanupInterval = setInterval(() => {
    const now = Date.now();
    let removed = 0;

    for (const [itemName, data] of visitorItems.entries()) {
      if (now - data.lastSeen > VISITOR_TIMEOUT_MS) {
        visitorItems.delete(itemName);
        subscribedItems.delete(itemName);
        removed++;
        console.log(`[Cleanup] Removed stale visitor: ${itemName}`);
      }
    }

    if (removed > 0) {
      broadcastVisitorCount();
      console.log(`[Cleanup] Removed ${removed} stale visitors. Total: ${visitorItems.size}`);
    }
  }, VISITOR_CLEANUP_INTERVAL_MS);

  console.log(`[Cleanup] Started visitor cleanup (timeout: ${VISITOR_TIMEOUT_MS / 1000}s, interval: ${VISITOR_CLEANUP_INTERVAL_MS / 1000}s)`);
}

/**
 * Poll Supabase for vote count changes
 * This is the PRIMARY mechanism for detecting changes (no Supabase Realtime dependency)
 * Polls every 500ms for all subscribed options
 */
let pollInterval = null;
const POLL_INTERVAL_MS = 500;

function startPolling() {
  if (pollInterval) return;

  pollInterval = setInterval(async () => {
    // Get all subscribed option IDs (excluding visitor item)
    const optionIds = [];
    for (const [itemName, item] of subscribedItems.entries()) {
      if (item.optionId && item.isActive) {
        optionIds.push(item.optionId);
      }
    }

    if (optionIds.length === 0) return;

    try {
      // Batch fetch all vote counts
      const { data, error } = await supabase
        .from("poll_options")
        .select("id, vote_count")
        .in("id", optionIds);

      if (error) {
        console.error("[Polling] Error fetching vote counts:", error);
        return;
      }

      // Check for changes and push updates
      for (const option of data || []) {
        const cachedCount = voteCounts.get(option.id);
        if (cachedCount !== option.vote_count) {
          voteCounts.set(option.id, option.vote_count);
          const itemName = `option_${option.id}`;
          if (subscribedItems.has(itemName)) {
            try {
              dataProvider.update(itemName, false, {
                vote_count: String(option.vote_count),
              });
              console.log(`[Polling] Pushed update: ${itemName} = ${option.vote_count}`);
            } catch (updateErr) {
              // Item may have been unsubscribed between check and update (race condition)
              // This is expected and can be safely ignored
            }
          }
        }
      }
    } catch (err) {
      console.error("[Polling] Exception:", err);
    }
  }, POLL_INTERVAL_MS);

  console.log(`[Polling] Started polling every ${POLL_INTERVAL_MS}ms`);
}

/**
 * Retry connection with exponential backoff
 */
async function connectWithRetry(maxRetries = 10, initialDelay = 2000) {
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt === 1) console.log(`[Adapter] Connecting to Lightstreamer...`);
      await initDataProvider();
      return true;
    } catch (err) {
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * 1.5, 30000);
      }
    }
  }

  return false;
}

/**
 * Main entry point
 */
async function main() {
  console.log("[Adapter] Starting Poll Vote Adapter...");
  // Supabase URL configured

  // Connect to Lightstreamer with retry
  const connected = await connectWithRetry();

  if (!connected) {
    console.error("[Adapter] Failed to connect to Lightstreamer after multiple attempts");
    process.exit(1);
  }

  // Start polling to detect vote changes (primary mechanism, no Supabase Realtime)
  startPolling();

  // Start visitor cleanup to remove stale connections
  startVisitorCleanup();

  console.log("[Adapter] Poll Vote Adapter is running");

  // Keep process alive
  process.on("SIGINT", () => {
    console.log("[Adapter] Shutting down...");
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("[Adapter] Shutting down...");
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("[Adapter] Fatal error:", err);
  process.exit(1);
});
