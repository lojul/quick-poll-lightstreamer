import { useState, useEffect, useRef, useCallback } from "react";
import {
  getLightstreamerClient,
  createVisitorSubscription,
  subscribe,
  unsubscribe,
  isLightstreamerEnabled,
  getConnectionStatus,
  type Subscription,
} from "@/integrations/lightstreamer/client";

export interface UseLightstreamerVisitorsReturn {
  /** Current number of concurrent visitors, null if not connected yet */
  visitorCount: number | null;
  /** Whether Lightstreamer is enabled */
  isEnabled: boolean;
  /** Whether currently connected */
  isConnected: boolean;
}

/**
 * React hook for tracking concurrent visitors via Lightstreamer
 * Uses unique visitor IDs so each browser is counted separately
 *
 * @returns Visitor count, enabled status, and connection status
 */
export function useLightstreamerVisitors(): UseLightstreamerVisitorsReturn {
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const visitorSubRef = useRef<Subscription | null>(null);
  const countSubRef = useRef<Subscription | null>(null);
  const visitorIdRef = useRef<string | null>(null);

  // Cleanup function to unsubscribe
  const cleanup = useCallback(() => {
    if (visitorSubRef.current) {
      try {
        unsubscribe(visitorSubRef.current);
      } catch (e) {
        // Ignore cleanup errors
      }
      visitorSubRef.current = null;
    }
    if (countSubRef.current) {
      try {
        unsubscribe(countSubRef.current);
      } catch (e) {
        // Ignore cleanup errors
      }
      countSubRef.current = null;
    }
  }, []);

  // Subscribe function
  const doSubscribe = useCallback(() => {
    const client = getLightstreamerClient();
    if (!client) return;

    // Clean up any existing subscriptions first
    cleanup();

    // Create subscriptions for visitor tracking
    console.log("[Visitors] Creating subscriptions...");
    const { visitorSub, countSub, visitorId } = createVisitorSubscription();
    visitorIdRef.current = visitorId;

    // Listen for count updates
    countSub.addListener({
      onItemUpdate: (update) => {
        const countStr = update.getValue("count");
        console.log("[Visitors] Received count update:", countStr);
        if (countStr !== null && countStr !== "") {
          const count = parseInt(countStr, 10);
          if (!isNaN(count)) {
            setVisitorCount(count);
          }
        }
      },
      onSubscription: () => {
        console.log("[Visitors] Count subscription active");
      },
      onSubscriptionError: (code, message) => {
        console.error(`[Visitors] Count subscription error ${code}: ${message}`);
      },
    });

    // Visitor subscription just registers this visitor
    visitorSub.addListener({
      onSubscription: () => {
        console.log("[Visitors] Visitor registered:", visitorId);
      },
      onSubscriptionError: (code, message) => {
        console.error(`[Visitors] Visitor subscription error ${code}: ${message}`);
      },
    });

    // Subscribe to both
    console.log("[Visitors] Subscribing with visitor ID:", visitorId);
    subscribe(visitorSub);
    subscribe(countSub);
    visitorSubRef.current = visitorSub;
    countSubRef.current = countSub;
  }, [cleanup]);

  // Poll for connection status and handle reconnection
  useEffect(() => {
    if (!isLightstreamerEnabled()) {
      return;
    }

    let wasConnected = false;

    // Check status and subscribe/resubscribe as needed
    const checkConnection = () => {
      const status = getConnectionStatus();
      const nowConnected = status === "CONNECTED";

      // Connection state changed
      if (nowConnected !== wasConnected) {
        setIsConnected(nowConnected);

        if (nowConnected && !wasConnected) {
          // Just connected - subscribe
          console.log("[Visitors] Connection established, subscribing...");
          doSubscribe();
        } else if (!nowConnected && wasConnected) {
          // Just disconnected - reset count to null (loading state)
          console.log("[Visitors] Connection lost");
          setVisitorCount(null);
        }

        wasConnected = nowConnected;
      }
    };

    // Check immediately
    checkConnection();

    // Poll for connection status changes
    const interval = setInterval(checkConnection, 500);

    return () => {
      clearInterval(interval);
      cleanup();
    };
  }, [doSubscribe, cleanup]);

  return {
    visitorCount,
    isEnabled: isLightstreamerEnabled(),
    isConnected,
  };
}
