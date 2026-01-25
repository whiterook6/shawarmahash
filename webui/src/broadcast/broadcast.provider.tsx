import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BroadcastCallback, BroadcastMessage } from "./broadcast.types";
import { BroadcastContext } from "./broadcast.context";

export const BroadcastProvider = ({
  eventSource,
  children,
}: {
  eventSource: EventSource;
  children: React.ReactNode;
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<Error | undefined>();
  const handlersRef = useRef<Set<BroadcastCallback>>(new Set());

  const onOpen = useCallback(() => {
    setIsConnected(true);
    setConnectionError(undefined);
  }, []);

  const onMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data) as BroadcastMessage;
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
  }, []);

  const onError = useCallback(() => {
    setIsConnected(false);

    // EventSource error event doesn't have a message property
    // Check readyState to determine error type
    if (eventSource.readyState === EventSource.CLOSED) {
      setConnectionError(new Error("Connection closed or failed to connect"));
    } else if (eventSource.readyState === EventSource.CONNECTING) {
      setConnectionError(new Error("Connection error while connecting"));
    } else {
      setConnectionError(new Error("Unknown connection error"));
    }
  }, [eventSource]);

  useEffect(() => {
    // Check initial connection state
    if (eventSource.readyState === EventSource.OPEN) {
      setIsConnected(true);
    }

    eventSource.addEventListener("open", onOpen);
    eventSource.addEventListener("message", onMessage);
    eventSource.addEventListener("error", onError);
    return () => {
      eventSource.removeEventListener("open", onOpen);
      eventSource.removeEventListener("message", onMessage);
      eventSource.removeEventListener("error", onError);
    };
  }, [eventSource, onOpen, onMessage, onError]);

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
