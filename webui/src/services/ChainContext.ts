import { createContext } from "preact";
import { Block, Chain } from "../Block";

export interface IChainContext {
  chain: Chain;
  ourBlocks: Chain;
  setChain: (chain: Chain) => void;
  appendBlock: (block: Block, ours?: boolean) => void;
}

export const ChainContext = createContext<IChainContext>({
  chain: [],
  ourBlocks: [],
  setChain: () => {},
  appendBlock: () => {},
});
