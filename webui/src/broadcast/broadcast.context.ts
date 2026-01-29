import { createContext } from "react";
import type { BroadcastCallback } from "./broadcast.types";

export const BroadcastContext = createContext<{
  isConnected: boolean;
  connectionError?: Error;
  subscribe: (callback: BroadcastCallback) => () => void; // returns an unsubscribe function
  connect: (params: { team: string; player: string; identity: string }) => void;
  disconnect: () => void;
}>({
  isConnected: false,
  subscribe: () => () => {},
  connect: () => {},
  disconnect: () => {},
});
