import { Block, verifyBlock } from "./Block";

export type Chain = Block[];

export const verifyChain = (chain: Chain, targetDifficulty: string) => {
  if (chain.length === 0){
    return;
  }

  let previousBlockHash = "0";
  let previousBlockTimestamp = chain[0].timestamp;
  for (let index = 0; index < chain.length; index++) {
    const block = chain[index];
    verifyBlock(block, previousBlockHash, previousBlockTimestamp, targetDifficulty);
    
    previousBlockTimestamp = block.timestamp;
    previousBlockHash = block.hashCode;
  }
};

export const appendBlock = (chain: Chain, block: Block): Chain => {
  if (chain.length === 0){
    return [block];
  }

  const top = chain[chain.length - 1];
  const topHash = top.hashCode;
  if (block.previousHash !== topHash){
    throw new Error(`Cannot append to chain: previous hash mismatch. Expected ${topHash}, got ${block.previousHash}`);
  }

  chain.push(block);
  return chain;
}