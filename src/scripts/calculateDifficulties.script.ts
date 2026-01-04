import { Difficulty } from "../difficulty/difficulty";

export const run = () => {
  for (let i = 0; i <= 64; i += 0.1) {
    const difficultyTarget = Difficulty.buildDifficultyTarget(i);
    console.log(`${i.toFixed(1)}: ${difficultyTarget}`);
  }
};

run();
