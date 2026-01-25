import { useContext } from "react";
import { BroadcastContext } from "./broadcast.context";

export const useBroadcast = () => {
  return useContext(BroadcastContext);
};
