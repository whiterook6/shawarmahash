import { createContext } from "react";
import type { MiningProgressResponse, MiningSuccessResponse } from "../types";

export interface MiningContext {
  isMining: boolean;
  progress: MiningProgressResponse["data"] | null;
  lastSuccess: MiningSuccessResponse["data"] | null;
  lastError: string | null;
  startMining: (target: {
    previousHash: string;
    previousTimestamp: number;
    difficulty: string;
    player: string;
    team: string;
  }) => void;
  stopMining: () => void;
}

export const MiningContext = createContext<MiningContext>({
  isMining: false,
  progress: null,
  lastSuccess: null,
  lastError: null,
  startMining: () => {},
  stopMining: () => {},
});
