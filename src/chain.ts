import { Block, calculateHash } from "./block";

export type Chain = Block[];

const MIN_DIFFICULTY = 5;
const DEFAULT_DIFFICULTY = Array(MIN_DIFFICULTY).fill("0").join("");
const TARGET_MINING_TIME_MS = 1000;
const BLOCKS_TO_CONSIDER = 10;

const countLeadingZeroes = (hash: string): number => {
  let count = 0;
  for (let i = 0; i < hash.length; i++) {
    if (hash[i] === "0") {
      count++;
    } else {
      break;
    }
  }
  return count;
};

const calculateAverageMiningTime = (blocks: Block[]): number => {
  let totalMiningTime = 0;
  for (let i = 1; i < blocks.length; i++) {
    totalMiningTime += blocks[i].timestamp - blocks[i - 1].timestamp;
  }
  return totalMiningTime / (blocks.length - 1);
};

const adjustDifficulty = (
  currentDifficulty: number,
  averageMiningTime: number,
): number => {
  // Proportional adjustment: new_difficulty = old_difficulty × (target_time / actual_time)
  // This matches Bitcoin and Ethereum"s approach
  const ratio = TARGET_MINING_TIME_MS / averageMiningTime;
  const newDifficulty = currentDifficulty * ratio;

  // Round to nearest integer and ensure minimum difficulty
  return Math.max(MIN_DIFFICULTY, Math.round(newDifficulty));
};

export const calculateDifficulty = (chain: Chain): string => {
  if (chain.length < BLOCKS_TO_CONSIDER) {
    return DEFAULT_DIFFICULTY;
  }

  const recentBlocks = chain.slice(-BLOCKS_TO_CONSIDER - 1);
  const averageMiningTime = calculateAverageMiningTime(recentBlocks);
  const lastBlock = chain[chain.length - 1];
  const currentDifficulty = countLeadingZeroes(lastBlock.hash);
  const adjustedDifficulty = adjustDifficulty(
    currentDifficulty,
    averageMiningTime,
  );

  return "0".repeat(adjustedDifficulty);
};

export type ChainValidationResult = {
  valid: boolean;
  error?: string;
};

export const verifyChain = (chain: Chain): ChainValidationResult => {
  // Empty chain is invalid
  if (chain.length === 0) {
    return {
      valid: false,
      error: "Chain is empty",
    };
  }

  // Verify genesis block (index 0)
  const genesisBlock = chain[0];
  if (genesisBlock.index !== 0) {
    return {
      valid: false,
      error: `Block at index 0 has invalid index: expected 0, got ${genesisBlock.index}`,
    };
  }

  // Verify genesis block has the correct hash value
  if (genesisBlock.hash !== "0") {
    return {
      valid: false,
      error: `Genesis block (index 0) has invalid hash: expected "0", got "${genesisBlock.hash}"`,
    };
  }

  // Verify each subsequent block
  for (let i = 1; i < chain.length; i++) {
    const currentBlock = chain[i];
    const previousBlock = chain[i - 1];

    // Check index is sequential
    if (currentBlock.index !== i) {
      return {
        valid: false,
        error: `Block at position ${i} has invalid index: expected ${i}, got ${currentBlock.index}`,
      };
    }

    // Check timestamp is valid (current >= previous)
    if (currentBlock.timestamp < previousBlock.timestamp) {
      return {
        valid: false,
        error: `Block at index ${i} has invalid timestamp: ${currentBlock.timestamp} is less than previous block's timestamp ${previousBlock.timestamp}`,
      };
    }

    // Calculate expected hash
    const expectedHash = calculateHash(
      previousBlock.hash,
      previousBlock.timestamp,
      currentBlock.player,
      currentBlock.team,
      currentBlock.nonce,
    );

    // Verify hash matches
    if (currentBlock.hash !== expectedHash) {
      return {
        valid: false,
        error: `Block at index ${i} has invalid hash: expected "${expectedHash}", got "${currentBlock.hash}"`,
      };
    }

    // Verify hash meets difficulty requirement
    // Calculate difficulty that would have been used when mining this block
    const chainUpToThisBlock = chain.slice(0, i);
    const requiredDifficulty = calculateDifficulty(chainUpToThisBlock);

    if (!currentBlock.hash.startsWith(requiredDifficulty)) {
      return {
        valid: false,
        error: `Block at index ${i} does not meet difficulty requirement: hash "${currentBlock.hash}" does not start with required difficulty "${requiredDifficulty}"`,
      };
    }
  }

  return { valid: true };
};
