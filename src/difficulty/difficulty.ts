import { Block } from "../block/block";
import { Chain } from "../chain/chain";

export const Difficulty = {
  MAX_DIFFICULTY_HASH: "ffffffffffffffffffffffffffffffff",
  MIN_DIFFICULTY_HASH: "00000000000000000000000000000000",
  DEFAULT_DIFFICULTY_HASH: "fffff000000000000000000000000000",
  MAX_DIFFICULTY: 32,
  MIN_DIFFICULTY: 0,
  DEFAULT_DIFFICULTY: 5,

  /**
   * Given a difficulty level, like 5.0625, build a target string like "fffff10000..."
   * @param difficulty
   * @returns A 32-character hash that can be compared with a block hash using greater-than-or-equal comparison.
   */
  buildDifficultyTarget: (difficulty: number): string => {
    if (difficulty <= Difficulty.MIN_DIFFICULTY) {
      return Difficulty.MIN_DIFFICULTY_HASH;
    } else if (difficulty >= Difficulty.MAX_DIFFICULTY) {
      return Difficulty.MAX_DIFFICULTY_HASH;
    }

    const integerPart = Math.floor(difficulty); // 5.0625 => 5
    const fractionalPart = difficulty % 1; // 5.0625 => 0.0625

    // Build the leading F's
    const leadingFs = "f".repeat(integerPart); // "fffff"

    // Convert fractional part to hex digit (0-15)
    // 0.0 => 0, 0.0625 => 1, 0.125 => 2, ..., 0.9375 => 15
    const hexDigit = Math.floor(fractionalPart * 16).toString(16);

    // Combine: "fffff" + hexDigit + zeros to make 32 chars
    const prefix = leadingFs + hexDigit;
    return prefix.padEnd(32, "0");
  },

  getDifficultyFromHash: (hash: string): number => {
    // count leading F's
    let count = 0;
    for (let i = 0; i < hash.length; i++) {
      if (hash[i] === "f") {
        count++;
      } else {
        break;
      }
    }

    // if we have leading F's and the next character is a hex digit, add a fraction
    if (count < hash.length) {
      const nextChar = hash[count];
      const hexValue = parseInt(nextChar, 16);
      // Fractional part: 0 => 0.0, 1 => 0.0625, 2 => 0.125, ..., 15 => 0.9375
      return count + hexValue / 16;
    }

    return count;
  },

  /**
   * @param chain - The chain to calculate the average difficulty of.
   * @returns The average difficulty of the chain.
   */
  getAverageDifficulty: (chain: Chain = []): number => {
    if (chain.length < 5) {
      return 5;
    }

    const totalDifficulty = chain.reduce((previous: number, current: Block) => {
      return previous + Difficulty.getDifficultyFromHash(current.hash);
    }, 0);
    return totalDifficulty / chain.length;
  },

  getDifficultyTargetFromChain: (previousBlocks: Chain = []): string => {
    if (previousBlocks.length < 100) {
      return Difficulty.DEFAULT_DIFFICULTY_HASH;
    }

    const oneHundredBlocks = previousBlocks.slice(-100);
    const averageDifficulty = Difficulty.getAverageDifficulty(oneHundredBlocks);
    const averageIntervalInSeconds = Math.max(
      1,
      Chain.getAverageMiningInterval(oneHundredBlocks),
    );
    const totalOps = Math.pow(16, averageDifficulty);
    const opsPerSecond = totalOps / averageIntervalInSeconds;
    const newDifficulty = Math.max(5, Math.log(opsPerSecond) / Math.log(16));
    return Difficulty.buildDifficultyTarget(newDifficulty);
  },

  isDifficultyMet: (hash: string, difficultyTarget: string): boolean => {
    return hash >= difficultyTarget;
  },
};
