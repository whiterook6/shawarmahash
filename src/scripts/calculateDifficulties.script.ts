import { Difficulty } from "../difficulty/difficulty";

export const run = () => {
  for (let i = 0; i <= 32; i += 0.1) {
    const difficultyTarget = Difficulty.buildDifficultyTarget(i);
    const difficulty = Difficulty.getDifficultyFromHash(difficultyTarget);
    const difference = Math.abs(difficulty - i);
    console.log(
      `${i.toFixed(2)}: ${difficultyTarget} (${difficulty.toFixed(2)}) ${difference.toFixed(2)}`,
    );
  }
};

run();
