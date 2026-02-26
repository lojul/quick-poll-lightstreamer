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

    // Create visitor subscription
    const subscription = createVisitorSubscription();

    // Add listener for visitor updates
    subscription.addListener({
      onItemUpdate: (update) => {
        const countStr = update.getValue("count");
        if (countStr !== null) {
          const count = parseInt(countStr, 10);
          if (!isNaN(count)) {
            setVisitorCount(count);
          }
        }
      },
      onSubscriptionError: (code, message) => {
        console.error(`[Lightstreamer] Visitor subscription error ${code}: ${message}`);
      },
    });

    // Subscribe
    subscribe(subscription);
    subscriptionRef.current = subscription;

    return () => {
      if (subscriptionRef.current) {
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
