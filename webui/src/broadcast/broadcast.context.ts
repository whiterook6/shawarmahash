import { createContext } from "react";
import type { BroadcastCallback } from "./broadcast.types";

export const BroadcastContext = createContext<{
  isConnected: boolean;
  connectionError?: Error;
  subscribe: (callback: BroadcastCallback) => () => void; // returns an unsubscribe function
}>({
  isConnected: false,
  subscribe: () => () => {},
});
