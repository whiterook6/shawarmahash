import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BroadcastCallback, BroadcastMessage } from "./broadcast.types";
import { BroadcastContext } from "./broadcast.context";

export const BroadcastProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<Error | undefined>();

  const handlersRef = useRef<Set<BroadcastCallback>>(new Set());
  const eventSourceRef = useRef<EventSource | null>(null);

  // Reconnect logic
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000; // 1 second

  const connect = useCallback(() => {
    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Clear any pending reconnect
    if (reconnectTimeoutRef.current !== null) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    try {
      console.log("[SSE] Connecting to /api/events");
      const eventSource = new EventSource("/api/events", {
        withCredentials: true,
      });
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log("[SSE] Connected to /api/events");
        setIsConnected(true);
        setConnectionError(undefined);
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as BroadcastMessage;
          console.log("[SSE] Received message:", data.type, data.payload);

          // Call all registered handlers (using refs, so no re-renders)
          handlersRef.current.forEach((handler) => {
            try {
              handler(data);
            } catch (error) {
              console.error("Error in SSE event handler:", error);
            }
          });
        } catch (error) {
          console.error("Error parsing SSE event:", error);
        }
      };

      eventSource.onerror = () => {
        console.warn(
          "[SSE] Connection error, readyState:",
          eventSource.readyState,
        );
        setIsConnected(false);

        // Only attempt reconnect if connection was previously open
        // (to avoid reconnecting on initial connection failures)
        if (eventSource.readyState === EventSource.CLOSED) {
          const attempts = reconnectAttemptsRef.current;
          if (attempts < maxReconnectAttempts) {
            reconnectAttemptsRef.current = attempts + 1;
            const delay = baseReconnectDelay * Math.pow(2, attempts); // Exponential backoff

            reconnectTimeoutRef.current = window.setTimeout(() => {
              connect();
            }, delay);
          } else {
            setConnectionError(
              new Error("Failed to connect to server after multiple attempts"),
            );
          }
        }
      };
    } catch (error) {
      console.error("[SSE] Error connecting to /api/events:", error);
      setConnectionError(
        error instanceof Error
          ? error
          : new Error("Failed to create SSE connection"),
      );
      setIsConnected(false);
    }
  }, []);

  // Connect on mount
  useEffect(() => {
    console.log("[SSE] Connecting to /api/events");
    connect();

    return () => {
      console.log("[SSE] Unmounting");
      // Cleanup on unmount
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current !== null) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  // Subscribe to events (returns unsubscribe function)
  const subscribe = useCallback((handler: BroadcastCallback) => {
    handlersRef.current.add(handler);

    // Return unsubscribe function
    return () => {
      handlersRef.current.delete(handler);
    };
  }, []);

  const value = useMemo(
    () => ({
      isConnected,
      connectionError,
      subscribe,
    }),
    [isConnected, connectionError, subscribe],
  );

  return (
    <BroadcastContext.Provider value={value}>
      {children}
    </BroadcastContext.Provider>
  );
};
