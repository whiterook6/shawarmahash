import { createContext } from "preact";
import { Block } from "../Block";

export interface IMiningContext {
  hashRate: number;
  isMining: boolean;
  player: string;
  previousHash: string;
  target: string;
  team?: string;

  setID: (player: string, team?: string) => void;
  startMining: (
    previousHash: string,
    target: string,
    onBlockMined: (newBlock: Block) => void
  ) => void;
  stopMining: () => void;
}

export const MiningContext = createContext<IMiningContext>({
  hashRate: 0,
  isMining: false,
  player: "",
  previousHash: "0",
  target: "00000fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",

  setID: () => {},
  startMining: () => {},
  stopMining: () => {},
});
