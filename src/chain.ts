import { Block } from "./block";

export type Chain = Block[];

const DEFAULT_DIFFICULTY = "00000";
const TARGET_MINING_TIME_MS = 1000;
const BLOCKS_TO_CONSIDER = 10;
const MIN_DIFFICULTY = DEFAULT_DIFFICULTY.length;

const countLeadingZeroes = (hash: string): number => {
  let count = 0;
  for (let i = 0; i < hash.length; i++) {
    if (hash[i] === '0') {
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

const adjustDifficulty = (currentDifficulty: number, averageMiningTime: number): number => {
  // Proportional adjustment: new_difficulty = old_difficulty × (target_time / actual_time)
  // This matches Bitcoin and Ethereum's approach
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
  const adjustedDifficulty = adjustDifficulty(currentDifficulty, averageMiningTime);

  return "0".repeat(adjustedDifficulty);
};