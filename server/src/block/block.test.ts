import expect from "expect";
import { describe, it } from "node:test";
import { Block } from "./block";

describe("Block", () => {
  describe("calculateHash", () => {
    it("It can calculate a hash", () => {
      const expectedHash = "fffff6e886f39c1b3b013ba831fab7b0";
      const previousHash = "fffff49f4553b0d3232ba598d4e36e8f";
      const actualHash = Block.calculateHash(
        previousHash,
        1767569572,
        "TIM",
        undefined,
        1063469,
      );
      expect(actualHash).toEqual(expectedHash);
    });

    it("It can calculate a hash with a team", () => {
      const expectedHash = "fffff86ec084f21ee3cc501d51068a39";
      const previousHash = "fffff3bbda1760827f461c9b3eb39945";
      const actualHash = Block.calculateHash(
        previousHash,
        1767569780,
        "MIT",
        "TIM",
        48536,
      );
      expect(actualHash).toEqual(expectedHash);
    });
  });

  describe("createGenesisBlock", () => {
    it("It can create a genesis block", () => {
      const genesisBlock = Block.createGenesisBlock("AAA");
      expect(genesisBlock).toEqual(
        expect.objectContaining({
          player: "AAA",
          hash: expect.any(String),
          previousHash: Block.GENESIS_PREVIOUS_HASH,
          index: 0,
          timestamp: expect.any(Number),
          nonce: expect.any(Number),
        }),
      );

      const expectedHash = genesisBlock.hash;
      const toEqualHash = Block.calculateHash(
        Block.GENESIS_PREVIOUS_HASH,
        0,
        "AAA",
        undefined,
        genesisBlock.nonce,
      );
      expect(expectedHash).toEqual(toEqualHash);
    });
  });

  describe("getRandomNumber", () => {
    it("It can get a random number", () => {
      // The hash "fffffdbf53e2c47ca9d00e4603facdbd" has last 8 chars "03facdbd"
      const block = Block.Faker.one({
        hash: "fffffdbf53e2c47ca9d00e4603facdbd",
      });
      expect(Block.getLikelihood(block)).toBeCloseTo(0.0155, 4);
    });

    it("Handles hash with minimum normalized value (all zeros)", () => {
      // Hash ending in "00000000" normalizes to 0.0
      const block = Block.Faker.one({
        hash: "1234567890abcdef12345678900000000",
      });
      const likelihood = Block.getLikelihood(block);
      expect(likelihood).toBe(0);
    });

    it("Handles hash with maximum normalized value (all fs)", () => {
      // Hash ending in "ffffffff" normalizes to exactly 1.0
      const block = Block.Faker.one({
        hash: "1234567890abcdef1234567890ffffffff",
      });
      const likelihood = Block.getLikelihood(block);
      expect(likelihood).toBe(1);
    });
  });
});
