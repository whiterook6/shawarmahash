import { describe, it } from "node:test";
import { Difficulty } from "./difficulty";
import expect from "expect";

describe("Difficulty", () => {
  it("can calculate the difficulty from a hash", () => {
    const hash =
      "0000000000000000000000000000000000000000000000000000000000000000";
    const difficulty = Difficulty.getDifficultyFromHash(hash);
    expect(difficulty).toBe(64);
  });

  it("can calculate the difficulty from a hash with a fraction", () => {
    const hash =
      "000004ffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
    const difficulty = Difficulty.getDifficultyFromHash(hash);
    expect(difficulty).toBe(5.75);
  });

  it("can calculate the difficulty from a hash with a different fraction", () => {
    const hash =
      "00000cffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
    const difficulty = Difficulty.getDifficultyFromHash(hash);
    expect(difficulty).toBe(5.25);
  });

  it("can calculate the difficulty from a hash without a fraction", () => {
    const hash =
      "00000fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
    const difficulty = Difficulty.getDifficultyFromHash(hash);
    expect(difficulty).toBe(5);
  });

  it("can check if the hash meets the difficulty target", () => {
    const targetHash =
      "000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffff";
    const hash =
      "000000000000abcfdeffffffffffffffffffffffffffffffffffffffffffffff";
    const meetsDifficulty = Difficulty.isDifficultyMet(hash, targetHash);
    expect(meetsDifficulty).toBe(true);

    const badHash =
      "00000000000abcfdefffffffffffffffffffffffffffffffffffffffffffffff";
    const meetsDifficultyBad = Difficulty.isDifficultyMet(badHash, targetHash);
    expect(meetsDifficultyBad).toBe(false);
  });
});
