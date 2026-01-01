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
});
