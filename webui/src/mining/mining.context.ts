import { createContext } from "react";
import type {
  MiningErrorResponse,
  MiningProgressResponse,
  MiningSuccessResponse,
} from "../types";

export type MiningSuccessCallback = (
  data: MiningSuccessResponse["data"],
) => void;

export interface MiningContext {
  isMining: boolean;
  progress: MiningProgressResponse["data"] | null;
  lastSuccess: MiningSuccessResponse["data"] | null;
  lastError: MiningErrorResponse["data"] | null;
  startMining: (target: {
    previousHash: string;
    previousTimestamp: number;
    difficulty: string;
    player: string;
    team: string;
  }) => void;
  stopMining: () => void;
  subscribe: (callback: MiningSuccessCallback) => () => void;
}

export const MiningContext = createContext<MiningContext>({
  isMining: false,
  progress: null,
  lastSuccess: null,
  lastError: null,
  startMining: () => {},
  stopMining: () => {},
  subscribe: () => () => {
    return;
  },
});
