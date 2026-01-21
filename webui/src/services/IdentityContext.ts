import { createContext } from "react";

export interface IdentityContext {
  identity: string | null;
  isLoading: boolean;
  error: string | null;
  generateNewIdentity: () => Promise<string>;
}

export const IdentityContext = createContext<IdentityContext>({
  identity: null,
  isLoading: true,
  error: null,
  generateNewIdentity: async () => {
    throw new Error("IdentityProvider not mounted");
  },
});
