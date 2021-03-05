import { Block, verifyBlock } from "./Block";

export type Chain = Block[];

export const verifyChain = (chain: Chain, targetDifficulty: string) => {
  if (chain.length === 0){
    return;
  }

  let previousBlockHash = "0";
  for (let index = 0; index < chain.length; index++) {
    const block = chain[index];
    verifyBlock(block, previousBlockHash, block.timestamp, targetDifficulty);
    
    previousBlockHash = block.hashCode;
  }
};