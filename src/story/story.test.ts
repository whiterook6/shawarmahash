import { describe, it } from "node:test";
import { Story } from "./story";
import expect from "expect";

describe("Story", () => {
  describe("shouldEventHappen", () => {
    it("Can check if an event should happen", () => {
      // The hash "fffffdbf53e2c47ca9d00e4603facdbd" has last 8 chars "03facdbd"
      // which normalizes to ~0.0155, so we need likelihoods around that value
      const successfulLikelihood = 0.02; // > 0.0155, so should return true
      const unsuccessfulLikelihood = 0.01; // < 0.0155, so should return false
      const blockHash = "fffffdbf53e2c47ca9d00e4603facdbd";
      const shouldHappen = Story.shouldEventHappen(
        successfulLikelihood,
        blockHash,
      );
      expect(shouldHappen).toBe(true);
      const shouldNotHappen = Story.shouldEventHappen(
        unsuccessfulLikelihood,
        blockHash,
      );
      expect(shouldNotHappen).toBe(false);
    });

    it("Returns false when likelihood is 0", () => {
      // Zero likelihood should never trigger an event
      const blockHash = "fffffdbf53e2c47ca9d00e4603facdbd";
      expect(Story.shouldEventHappen(0, blockHash)).toBe(false);
    });

    it("Returns true when likelihood is 1", () => {
      // 100% likelihood should always trigger (special case handled)
      const blockHash = "fffffdbf53e2c47ca9d00e4603facdbd";
      expect(Story.shouldEventHappen(1, blockHash)).toBe(true);
    });

    it("Handles hash with minimum normalized value (all zeros)", () => {
      // Hash ending in "00000000" normalizes to 0.0
      const blockHash = "1234567890abcdef12345678900000000";
      // Should return true for any likelihood > 0 (since 0 < likelihood)
      expect(Story.shouldEventHappen(0.0001, blockHash)).toBe(true);
      expect(Story.shouldEventHappen(0.5, blockHash)).toBe(true);
      expect(Story.shouldEventHappen(1, blockHash)).toBe(true);
      // Should return false only for likelihood = 0
      expect(Story.shouldEventHappen(0, blockHash)).toBe(false);
    });

    it("Handles hash with maximum normalized value (all F's)", () => {
      // Hash ending in "ffffffff" normalizes to exactly 1.0
      const blockHash = "1234567890abcdef1234567890ffffffff";
      // Should return false for likelihood < 1 (since 1.0 < likelihood is false)
      expect(Story.shouldEventHappen(0.5, blockHash)).toBe(false);
      expect(Story.shouldEventHappen(0.9999, blockHash)).toBe(false);
      // Should return true for likelihood >= 1 (special case handled)
      expect(Story.shouldEventHappen(1, blockHash)).toBe(true);
    });
  });
});
