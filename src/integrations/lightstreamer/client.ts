import {
  LightstreamerClient,
  Subscription,
  ConsoleLogLevel,
  ConsoleLoggerProvider,
} from "lightstreamer-client-web";

// Configure logging in development
if (import.meta.env.DEV) {
  LightstreamerClient.setLoggerProvider(new ConsoleLoggerProvider(ConsoleLogLevel.WARN));
}

// Lightstreamer server URL from environment
const LIGHTSTREAMER_URL = import.meta.env.VITE_LIGHTSTREAMER_URL || "";

// Singleton client instance
let clientInstance: LightstreamerClient | null = null;

export type ConnectionStatus = "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "STALLED" | "ERROR";

export interface ConnectionListener {
  onStatusChange: (status: ConnectionStatus) => void;
}

/**
 * Get or create the Lightstreamer client singleton
 */
export function getLightstreamerClient(): LightstreamerClient | null {
  if (!LIGHTSTREAMER_URL) {
    console.warn("VITE_LIGHTSTREAMER_URL not configured, Lightstreamer disabled");
    return null;
  }

  if (!clientInstance) {
    clientInstance = new LightstreamerClient(LIGHTSTREAMER_URL, "POLL_ADAPTER");
  }

  return clientInstance;
}

/**
 * Connect to Lightstreamer server
 */
export function connect(listener?: ConnectionListener): void {
  const client = getLightstreamerClient();
  if (!client) return;

  if (listener) {
    client.addListener({
      onStatusChange: (status: string) => {
        let mappedStatus: ConnectionStatus = "DISCONNECTED";

        if (status.startsWith("CONNECTED")) {
          mappedStatus = "CONNECTED";
        } else if (status.startsWith("CONNECTING") || status === "STALLED") {
          mappedStatus = "CONNECTING";
        } else if (status.startsWith("DISCONNECTED")) {
          mappedStatus = status.includes("WILL-RETRY") ? "CONNECTING" : "DISCONNECTED";
        }

        listener.onStatusChange(mappedStatus);
      },
    });
  }

  client.connect();
}

/**
 * Disconnect from Lightstreamer server
 */
export function disconnect(): void {
  const client = getLightstreamerClient();
  if (client) {
    client.disconnect();
  }
}

/**
 * Create a subscription for vote count updates
 * Uses MERGE mode for efficient delta updates
 *
 * @param optionIds - Array of poll option IDs to subscribe to
 * @returns Subscription instance
 */
export function createVoteSubscription(optionIds: string[]): Subscription | null {
  if (optionIds.length === 0) return null;

  // Create item names in format "option_<id>" for each option
  const items = optionIds.map((id) => `option_${id}`);

  // Subscribe to vote_count field
  const subscription = new Subscription("MERGE", items, ["vote_count"]);

  // Request snapshot on subscription
  subscription.setRequestedSnapshot("yes");

  // Set data adapter
  subscription.setDataAdapter("VoteAdapter");

  return subscription;
}

/**
 * Subscribe to vote updates
 */
export function subscribe(subscription: Subscription): void {
  const client = getLightstreamerClient();
  if (client && subscription) {
    client.subscribe(subscription);
  }
}

/**
 * Unsubscribe from vote updates
 */
export function unsubscribe(subscription: Subscription): void {
  const client = getLightstreamerClient();
  if (client && subscription) {
    client.unsubscribe(subscription);
  }
}

/**
 * Check if Lightstreamer is configured and available
 */
export function isLightstreamerEnabled(): boolean {
  return !!LIGHTSTREAMER_URL;
}

/**
 * Get current connection status
 */
export function getConnectionStatus(): ConnectionStatus {
  const client = getLightstreamerClient();
  if (!client) return "DISCONNECTED";

  const status = client.getStatus();
  if (status.startsWith("CONNECTED")) return "CONNECTED";
  if (status.startsWith("CONNECTING") || status === "STALLED") return "CONNECTING";
  if (status.includes("WILL-RETRY")) return "CONNECTING";
  return "DISCONNECTED";
}

/**
 * Generate UUID with fallback for older browsers (Android WebView, etc.)
 */
function generateUUID(): string {
  // Use crypto.randomUUID() if available (modern browsers)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for older browsers (Android 9 and below, older WebViews)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Create a subscription for concurrent visitor count
 * Uses a unique visitor ID so each browser is counted separately
 */
export function createVisitorSubscription(): { visitorSub: Subscription; countSub: Subscription; visitorId: string } {
  // Generate unique visitor ID (with fallback for older Android)
  const visitorId = `visitor_${generateUUID()}`;

  // Subscribe to unique visitor item (for tracking this visitor)
  const visitorSub = new Subscription("MERGE", [visitorId], ["ping"]);
  visitorSub.setRequestedSnapshot("yes");
  visitorSub.setDataAdapter("VoteAdapter");

  // Subscribe to visitor count (to receive total count updates)
  const countSub = new Subscription("MERGE", ["visitors_count"], ["count"]);
  countSub.setRequestedSnapshot("yes");
  countSub.setDataAdapter("VoteAdapter");

  return { visitorSub, countSub, visitorId };
}

export { LightstreamerClient, Subscription };
