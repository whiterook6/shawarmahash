import { createContext } from "preact";

export interface IGameContext {
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

export const GameContext = createContext<IGameContext>({
  hashRate: 0,
  isMining: false,
  player: "",
  previousHash: "0",
  target: "00000",

  setID: () => {},
  startMining: () => {},
  stopMining: () => {},
});