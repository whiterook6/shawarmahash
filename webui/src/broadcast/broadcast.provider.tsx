import { useCallback, useMemo, useRef, useState } from "react";
import { BroadcastContext } from "./broadcast.context";
import type { BroadcastCallback, BroadcastMessage } from "./broadcast.types";

export const BroadcastProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<Error | undefined>();
  const handlersRef = useRef<Set<BroadcastCallback>>(new Set());
  const eventSourceRef = useRef<EventSource | null>(null);

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
    const current = eventSourceRef.current;

    // EventSource error event doesn't have a message property
    // Check readyState to determine error type
    if (!current || current.readyState === EventSource.CLOSED) {
      setConnectionError(new Error("Connection closed or failed to connect"));
    } else if (current.readyState === EventSource.CONNECTING) {
      setConnectionError(new Error("Connection error while connecting"));
    } else {
      setConnectionError(new Error("Unknown connection error"));
    }
  }, []);

  const disconnect = useCallback(() => {
    const current = eventSourceRef.current;
    if (!current) {
      return;
    }

    current.removeEventListener("open", onOpen);
    current.removeEventListener("message", onMessage);
    current.removeEventListener("error", onError);
    current.close();
    eventSourceRef.current = null;
    setIsConnected(false);
  }, [onOpen, onMessage, onError]);

  const connect = useCallback(
    (params: { team: string; player: string; identity: string }) => {
      disconnect();
      setConnectionError(undefined);

      const query = new URLSearchParams({
        team: params.team,
        player: params.player,
        identity: params.identity,
      });
      const next = new EventSource(`/api/events?${query.toString()}`, {
        withCredentials: true,
      });
      eventSourceRef.current = next;

      // Check initial connection state
      if (next.readyState === EventSource.OPEN) {
        setIsConnected(true);
      }

      next.addEventListener("open", onOpen);
      next.addEventListener("message", onMessage);
      next.addEventListener("error", onError);
    },
    [disconnect, onOpen, onMessage, onError],
  );

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
      connect,
      disconnect,
    }),
    [isConnected, connectionError, subscribe, connect, disconnect],
  );

  return (
    <BroadcastContext.Provider value={value}>
      {children}
    </BroadcastContext.Provider>
  );
};
