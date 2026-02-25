/**
 * Lightstreamer Data Adapter for Poll Vote Streaming
 *
 * This adapter:
 * 1. Connects to Supabase and subscribes to poll_options changes
 * 2. Pushes vote count updates to Lightstreamer clients in real-time
 * 3. Provides snapshot data when clients subscribe
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
        callback(itemName.startsWith("option_"));
      });

      // Handle subscription requests
      dataProvider.on("subscribe", async (itemName, response) => {

        if (!itemName.startsWith("option_")) {
          response.error("Invalid item name. Expected format: option_<uuid>");
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
          subscribedItems.delete(itemName);
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
 * Subscribe to Supabase real-time changes for poll_options
 */
function subscribeToSupabase() {
  const channel = supabase
    .channel("poll-options-changes")
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "poll_options" },
      (payload) => {
        const { id, vote_count } = payload.new;

        // Update cache
        voteCounts.set(id, vote_count);

        // Push update to Lightstreamer clients
        const itemName = `option_${id}`;
        if (subscribedItems.has(itemName) && subscribedItems.get(itemName).isActive) {
          dataProvider.update(itemName, false, {
            vote_count: String(vote_count),
          });
        }
      }
    )
    .subscribe((status, err) => {
      if (status === "SUBSCRIBED") {
        console.log("[Supabase] Subscribed to poll_options changes");
      } else if (err) {
        console.error("[Supabase] Subscription error:", err);
      }
    });

  return channel;
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

  // Subscribe to Supabase changes
  subscribeToSupabase();

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
