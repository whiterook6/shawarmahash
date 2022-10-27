import { createContext } from "preact";
import { Block } from "../Block";

export interface IMiningContext {
  hashRate: number;
  player: string;
  previousHash: string;
  target: string;
  team?: string;

  isMining: () => boolean;
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
  player: "",
  previousHash: "0",
  target: "00000fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",

  isMining: () => false,
  setID: () => {},
  startMining: () => {},
  stopMining: () => {},
});
