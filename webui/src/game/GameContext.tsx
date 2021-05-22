import { createContext } from "preact";

export interface IGameContext {
  getPlayer: () => string;
  setPlayer: (player: string) => void;
  getTeam: () => string;
  setTeam: (team?: string) => void;
}

export const GameContext = createContext<IGameContext>({
  getPlayer: () => "",
  setPlayer: () => {},
  getTeam: () => "",
  setTeam: () => {}
});