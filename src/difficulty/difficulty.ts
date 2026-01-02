import { Block } from "../block/block";
import { Chain } from "../chain/chain";

export const Difficulty = {
  DEFAULT_DIFFICULTY_HASH:
    "00000fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",

  /**
   * Given a difficulty level, like 6.25, build a target string like "0...08f...f"
   * @param difficulty
   * @returns A 64-character hash that can be compared with a block hash using less-than comparison.
   */
  buildDifficultyTarget: (difficulty: number): string => {
    const decimal = difficulty % 1; // 32.456 => .456
    const middleChar = (15 - Math.floor(decimal * 16)).toString(16); // (0.456 => "8")
    return middleChar.padStart(difficulty + 1, "0").padEnd(64, "f"); // 0...08f...f, 64 chars long
  },

  getDifficultyFromHash: (hash: string): number => {
    // count leading zeroes
    let count = 0;
    for (let i = 0; i < hash.length; i++) {
      if (hash[i] === "0") {
        count++;
      } else {
        break;
      }
    }

    // if the next character is less than f, add a fraction (X / 16)
    if (count < hash.length) {
      const nextChar = hash[count];
      if (nextChar < "f") {
        return count + 1 - parseInt(nextChar, 16) / 16;
      }
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
      return "00000fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
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
    return hash < difficultyTarget;
  },
};
