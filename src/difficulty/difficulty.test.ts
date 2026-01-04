import { describe, it } from "node:test";
import { Difficulty } from "./difficulty";
import expect from "expect";

describe("Difficulty", () => {
  describe("buildDifficultyTarget", () => {
    it("Builds difficulty targets in order", () => {
      let previousDifficultyTarget =
        "0000000000000000000000000000000000000000000000000000000000000000";
      for (let i = 0; i <= 64; i += 0.05) {
        const difficultyTarget = Difficulty.buildDifficultyTarget(i);
        expect(difficultyTarget >= previousDifficultyTarget).toBe(true);
        previousDifficultyTarget = difficultyTarget;
      }

      const allTargets = Array.from({ length: 64 }, (_, i) =>
        Difficulty.buildDifficultyTarget(i),
      );
      const sortedTargets = allTargets.sort((a, b) => a.localeCompare(b));
      expect(sortedTargets).toEqual(allTargets);
    });
  });

  describe("getDifficultyFromHash", () => {
    it("Can get the difficulty from a hash", () => {
      for (let i = 0; i <= 32; i += 0.05) {
        const difficultyTarget = Difficulty.buildDifficultyTarget(i);
        const difficulty = Difficulty.getDifficultyFromHash(difficultyTarget);
        const difference = Math.abs(difficulty - i);
        expect(difference).toBeLessThanOrEqual(0.1);
      }
    });
  });

  describe("getDifficultyTargetFromChain", () => {});

  describe("isDifficultyMet", () => {
    it("Can check if a hash meets a difficulty target", () => {
      const difficultyTarget =
        "fffffffff1000000000000000000000000000000000000000000000000000000";
      const hash =
        "fffffffffce67ad6b81718943f17c5ebdf214f9cc8c927220fa45426948b76bd";
      const isMet = Difficulty.isDifficultyMet(hash, difficultyTarget);
      expect(isMet).toBe(true);
    });

    it("Can check if a hash does not meet a difficulty target", () => {
      const difficultyTarget =
        "ffffffffff000000000000000000000000000000000000000000000000000000";
      const hash =
        "fffffffff1ce67ad6b81718943f17c5ebdf214f9cc8c927220fa45426948b76bd";
      const isMet = Difficulty.isDifficultyMet(hash, difficultyTarget);
      expect(isMet).toBe(false);
    });
  });
});
