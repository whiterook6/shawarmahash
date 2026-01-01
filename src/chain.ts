import { Block } from "./block";

export type Chain = Block[];

export const MIN_DIFFICULTY = 5;
export const DEFAULT_DIFFICULTY = Array(MIN_DIFFICULTY).fill("0").join("");
export const TARGET_MINING_TIME_MS = 1000;
export const BLOCKS_TO_CONSIDER = 10;

export const Chain = {
  countLeadingZeroes: (hash: string): number => {
    let count = 0;
    for (let i = 0; i < hash.length; i++) {
      if (hash[i] === "0") {
        count++;
      } else {
        break;
      }
    }
    return count;
  },

  calculateAverageMiningTime: (blocks: Block[]): number => {
    let totalMiningTime = 0;
    for (let i = 1; i < blocks.length; i++) {
      totalMiningTime += blocks[i].timestamp - blocks[i - 1].timestamp;
    }
    return totalMiningTime / (blocks.length - 1);
  },

  adjustDifficulty: (
    currentDifficulty: number,
    averageMiningTime: number,
  ): number => {
    // Proportional adjustment: new_difficulty = old_difficulty × (target_time / actual_time)
    // This matches Bitcoin and Ethereum"s approach
    const ratio = TARGET_MINING_TIME_MS / averageMiningTime;
    const newDifficulty = currentDifficulty * ratio;

    // Round to nearest integer and ensure minimum difficulty
    return Math.max(MIN_DIFFICULTY, Math.round(newDifficulty));
  },

  calculateDifficulty: (chain: Chain): string => {
    if (chain.length < BLOCKS_TO_CONSIDER) {
      return DEFAULT_DIFFICULTY;
    }

    const recentBlocks = chain.slice(-BLOCKS_TO_CONSIDER - 1);
    const averageMiningTime = Chain.calculateAverageMiningTime(recentBlocks);
    const lastBlock = chain[chain.length - 1];
    const currentDifficulty = Chain.countLeadingZeroes(lastBlock.hash);
    const adjustedDifficulty = Chain.adjustDifficulty(
      currentDifficulty,
      averageMiningTime,
    );

    return "0".repeat(adjustedDifficulty);
  },

  verifyChain: (chain: Chain): boolean => {
    // Empty chain is invalid
    if (chain.length === 0) {
      return false;
    }

    // Verify genesis block (index 0)
    const genesisBlock = chain[0];
    if (genesisBlock.index !== 0) {
      return false;
    }

    // Verify genesis block has the correct hash value
    if (genesisBlock.hash !== "0000000000000000000000000000000000000000000000000000000000000000") {
      return false;
    }

    // Verify genesis block has the correct previousHash
    if (genesisBlock.previousHash !== "0000000000000000000000000000000000000000000000000000000000000000") {
      return false;
    }

    // Verify each subsequent block
    for (let i = 1; i < chain.length; i++) {
      const currentBlock = chain[i];
      const previousBlock = chain[i - 1];

      // Check index is sequential
      if (currentBlock.index !== i) {
        return false;
      }

      // Check timestamp is valid (current >= previous)
      if (currentBlock.timestamp < previousBlock.timestamp) {
        return false;
      }

      // Verify previousHash matches the actual previous block's hash
      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }

      // Calculate expected hash
      const expectedHash = Block.calculateHash(
        previousBlock.hash,
        previousBlock.timestamp,
        currentBlock.player,
        currentBlock.team,
        currentBlock.nonce,
      );

      // Verify hash matches
      if (currentBlock.hash !== expectedHash) {
        return false;
      }

      // Verify hash meets difficulty requirement
      // Calculate difficulty that would have been used when mining this block
      const chainUpToThisBlock = chain.slice(0, i);
      const requiredDifficulty = Chain.calculateDifficulty(chainUpToThisBlock);

      if (!currentBlock.hash.startsWith(requiredDifficulty)) {
        return false;
      }
    }

    return true;
  },
};
