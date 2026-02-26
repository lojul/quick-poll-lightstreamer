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
 * Automatically subscribes when the Lightstreamer client is available
 *
 * @returns Visitor count and enabled status
 */
export function useLightstreamerVisitors(): UseLightstreamerVisitorsReturn {
  const [visitorCount, setVisitorCount] = useState(0);
  const subscriptionRef = useRef<Subscription | null>(null);

  useEffect(() => {
    if (!isLightstreamerEnabled()) {
      return;
    }

    const client = getLightstreamerClient();
    if (!client) return;

    // Create subscription for visitor count
    console.log("[Visitors] Creating subscription...");
    const subscription = createVisitorSubscription();

    subscription.addListener({
      onItemUpdate: (update) => {
        const countStr = update.getValue("count");
        console.log("[Visitors] Received update:", countStr);
        if (countStr !== null) {
          const count = parseInt(countStr, 10);
          if (!isNaN(count)) {
            setVisitorCount(count);
          }
        }
      },
      onSubscription: () => {
        console.log("[Visitors] Subscription active");
      },
      onSubscriptionError: (code, message) => {
        console.error(`[Visitors] Subscription error ${code}: ${message}`);
      },
    });

    // Subscribe - Lightstreamer will queue this if not yet connected
    console.log("[Visitors] Subscribing...");
    subscribe(subscription);
    subscriptionRef.current = subscription;

    return () => {
      if (subscriptionRef.current) {
        console.log("[Visitors] Unsubscribing...");
        unsubscribe(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, []);

  return {
    visitorCount,
    isEnabled: isLightstreamerEnabled(),
  };
}
