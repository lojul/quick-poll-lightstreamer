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
  /** Set of option IDs that are currently flashing (just received update) */
  flashingOptions: Set<string>;
  /** Connection status */
  connectionStatus: LightstreamerConnectionStatus;
  /** Whether Lightstreamer is enabled */
  isEnabled: boolean;
  /** Update the list of option IDs to subscribe to */
  setOptionIds: (ids: string[]) => void;
  /** Last time a vote update was received */
  lastUpdate: Date;
}

/**
 * React hook for real-time vote streaming via Lightstreamer
 *
 * @returns Vote updates map and connection status
 */
const FLASH_DURATION_MS = 600; // How long the flash effect lasts

export function useLightstreamerVotes(): UseLightstreamerVotesReturn {
  const [voteUpdates, setVoteUpdates] = useState<Map<string, number>>(new Map());
  const [flashingOptions, setFlashingOptions] = useState<Set<string>>(new Set());
  const [connectionStatus, setConnectionStatus] = useState<LightstreamerConnectionStatus>(
    isLightstreamerEnabled() ? "disconnected" : "disabled"
  );
  const [optionIds, setOptionIds] = useState<string[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const subscriptionRef = useRef<Subscription | null>(null);
  const isConnectedRef = useRef(false);
  const flashTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

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
        const isSnapshot = update.isSnapshot();

        if (voteCountStr !== null) {
          const voteCount = parseInt(voteCountStr, 10);
          if (!isNaN(voteCount)) {
            // Check if this is a real update (not initial snapshot)
            const previousCount = voteUpdates.get(optionId);
            const isRealUpdate = !isSnapshot && previousCount !== undefined && previousCount !== voteCount;

            setVoteUpdates((prev) => {
              const next = new Map(prev);
              next.set(optionId, voteCount);
              return next;
            });

            // Only flash on real updates (not initial load)
            if (isRealUpdate) {
              // Clear any existing timeout for this option
              const existingTimeout = flashTimeoutsRef.current.get(optionId);
              if (existingTimeout) {
                clearTimeout(existingTimeout);
              }

              // Add to flashing set
              setFlashingOptions((prev) => new Set([...prev, optionId]));

              // Remove from flashing set after duration
              const timeout = setTimeout(() => {
                setFlashingOptions((prev) => {
                  const next = new Set(prev);
                  next.delete(optionId);
                  return next;
                });
                flashTimeoutsRef.current.delete(optionId);
              }, FLASH_DURATION_MS);

              flashTimeoutsRef.current.set(optionId, timeout);
            }

            // Update timestamp when vote update received from Lightstreamer
            setLastUpdate(new Date());
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

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      flashTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      flashTimeoutsRef.current.clear();
    };
  }, []);

  return {
    voteUpdates,
    flashingOptions,
    connectionStatus,
    isEnabled: isLightstreamerEnabled(),
    setOptionIds,
    lastUpdate,
  };
}
