import { useState, useEffect, useRef, useCallback } from "react";
import {
  getLightstreamerClient,
  connect,
  disconnect,
  createVoteSubscription,
  subscribe,
  unsubscribe,
  isLightstreamerEnabled,
  type ConnectionStatus,
  type Subscription,
} from "@/integrations/lightstreamer/client";

export type LightstreamerConnectionStatus = "connected" | "disconnected" | "connecting" | "disabled";

export interface VoteUpdate {
  optionId: string;
  voteCount: number;
}

export interface UseLightstreamerVotesReturn {
  /** Map of option ID to current vote count */
  voteUpdates: Map<string, number>;
  /** Connection status */
  connectionStatus: LightstreamerConnectionStatus;
  /** Whether Lightstreamer is enabled */
  isEnabled: boolean;
  /** Update the list of option IDs to subscribe to */
  setOptionIds: (ids: string[]) => void;
}

/**
 * React hook for real-time vote streaming via Lightstreamer
 *
 * @returns Vote updates map and connection status
 */
export function useLightstreamerVotes(): UseLightstreamerVotesReturn {
  const [voteUpdates, setVoteUpdates] = useState<Map<string, number>>(new Map());
  const [connectionStatus, setConnectionStatus] = useState<LightstreamerConnectionStatus>(
    isLightstreamerEnabled() ? "disconnected" : "disabled"
  );
  const [optionIds, setOptionIds] = useState<string[]>([]);

  const subscriptionRef = useRef<Subscription | null>(null);
  const isConnectedRef = useRef(false);

  // Map internal status to hook status
  const mapStatus = useCallback((status: ConnectionStatus): LightstreamerConnectionStatus => {
    switch (status) {
      case "CONNECTED":
        return "connected";
      case "CONNECTING":
      case "STALLED":
        return "connecting";
      default:
        return "disconnected";
    }
  }, []);

  // Connect to Lightstreamer on mount
  useEffect(() => {
    if (!isLightstreamerEnabled()) {
      return;
    }

    const client = getLightstreamerClient();
    if (!client) return;

    connect({
      onStatusChange: (status) => {
        const mappedStatus = mapStatus(status);
        setConnectionStatus(mappedStatus);
        isConnectedRef.current = mappedStatus === "connected";
      },
    });

    return () => {
      disconnect();
      isConnectedRef.current = false;
    };
  }, [mapStatus]);

  // Subscribe to vote updates when option IDs change
  useEffect(() => {
    if (!isLightstreamerEnabled() || optionIds.length === 0) {
      return;
    }

    const client = getLightstreamerClient();
    if (!client) return;

    // Unsubscribe from previous subscription
    if (subscriptionRef.current) {
      unsubscribe(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    // Create new subscription
    const subscription = createVoteSubscription(optionIds);
    if (!subscription) return;

    // Add listener for vote updates
    subscription.addListener({
      onItemUpdate: (update) => {
        const itemName = update.getItemName();
        const optionId = itemName.replace("option_", "");
        const voteCountStr = update.getValue("vote_count");

        if (voteCountStr !== null) {
          const voteCount = parseInt(voteCountStr, 10);
          if (!isNaN(voteCount)) {
            setVoteUpdates((prev) => {
              const next = new Map(prev);
              next.set(optionId, voteCount);
              return next;
            });
          }
        }
      },
      onSubscriptionError: (code, message) => {
        console.error(`[Lightstreamer] Subscription error ${code}: ${message}`);
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
  }, [optionIds]);

  return {
    voteUpdates,
    connectionStatus,
    isEnabled: isLightstreamerEnabled(),
    setOptionIds,
  };
}
