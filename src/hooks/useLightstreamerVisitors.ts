import { useState, useEffect, useRef } from "react";
import {
  getLightstreamerClient,
  createVisitorSubscription,
  subscribe,
  unsubscribe,
  isLightstreamerEnabled,
  type Subscription,
} from "@/integrations/lightstreamer/client";

export interface UseLightstreamerVisitorsReturn {
  /** Current number of concurrent visitors */
  visitorCount: number;
  /** Whether Lightstreamer is enabled */
  isEnabled: boolean;
}

/**
 * React hook for tracking concurrent visitors via Lightstreamer
 * Uses unique visitor IDs so each browser is counted separately
 *
 * @returns Visitor count and enabled status
 */
export function useLightstreamerVisitors(): UseLightstreamerVisitorsReturn {
  const [visitorCount, setVisitorCount] = useState(0);
  const visitorSubRef = useRef<Subscription | null>(null);
  const countSubRef = useRef<Subscription | null>(null);

  useEffect(() => {
    if (!isLightstreamerEnabled()) {
      return;
    }

    const client = getLightstreamerClient();
    if (!client) return;

    // Create subscriptions for visitor tracking
    console.log("[Visitors] Creating subscriptions...");
    const { visitorSub, countSub, visitorId } = createVisitorSubscription();

    // Listen for count updates
    countSub.addListener({
      onItemUpdate: (update) => {
        const countStr = update.getValue("count");
        console.log("[Visitors] Received count update:", countStr);
        if (countStr !== null) {
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

    return () => {
      console.log("[Visitors] Unsubscribing...");
      if (visitorSubRef.current) {
        unsubscribe(visitorSubRef.current);
        visitorSubRef.current = null;
      }
      if (countSubRef.current) {
        unsubscribe(countSubRef.current);
        countSubRef.current = null;
      }
    };
  }, []);

  return {
    visitorCount,
    isEnabled: isLightstreamerEnabled(),
  };
}
