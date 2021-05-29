import { createContext } from "preact";

export interface IMiningContext {
  hashRate: number;
  isMining: boolean;
  player: string;
  previousHash: string;
  target: string;
  team?: string;

  setID: (player: string, team?: string) => void;
  startMining: (previousHash: string, target: string) => void;
  stopMining: () => void;
}

export const MiningContext = createContext<IMiningContext>({
  hashRate: 0,
  isMining: false,
  player: "",
  previousHash: "0",
  target: "00000",

  setID: () => {},
  startMining: () => {},
  stopMining: () => {},
});