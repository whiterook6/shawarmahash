import { createContext } from "react";

export const IdentityContext = createContext<{
  errorGeneratingIdentity?: Error;
  generateNewIdentity: () => Promise<void>;
  identity?: string;
  isGeneratingIdentity: boolean;
  player?: string;
  setPlayer: (player: string) => void;
  setTeam: (team: string) => void;
  team?: string;
}>({
  generateNewIdentity: async () => void 0,
  identity: undefined,
  isGeneratingIdentity: false,
  player: undefined,
  setPlayer: () => {},
  setTeam: () => {},
  team: undefined,
});
