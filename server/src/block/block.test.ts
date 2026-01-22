import expect from "expect";
import { describe, it } from "node:test";
import { Block } from "./block";
import { BlockFaker } from "./block.faker";

describe("Block", () => {
  describe("calculateHash", () => {
    it("It can calculate a hash with a team", () => {
      const expectedHash = "fffffd908585329758a160fffe3b25ef";
      const previousHash = "fffffe892c7ab1a894578e502be6a804";
      const actualHash = Block.calculateHash({
        previousHash,
        previousTimestamp: 1768790924,
        player: "TIM",
        team: "TST",
        nonce: 292026,
      });
      expect(actualHash).toEqual(expectedHash);
    });
  });

  describe("createGenesisBlock", () => {
    it("It can create a genesis block", () => {
      const genesisBlock = Block.createGenesisBlock({
        player: "AAA",
        team: "BBB",
        identity: "b989bcb4a39c769d",
      });
      expect(genesisBlock).toEqual(
        expect.objectContaining({
          player: "AAA",
          team: "BBB",
          hash: expect.any(String),
          previousHash: Block.GENESIS_PREVIOUS_HASH,
          index: 0,
          timestamp: expect.any(Number),
          nonce: expect.any(Number),
        }),
      );

      const expectedHash = genesisBlock.hash;
      const toEqualHash = Block.calculateHash({
        previousHash: Block.GENESIS_PREVIOUS_HASH,
        previousTimestamp: 0,
        player: "AAA",
        team: "BBB",
        nonce: genesisBlock.nonce,
      });
      expect(expectedHash).toEqual(toEqualHash);
    });
  });

  describe("getRandomNumber", () => {
    it("It can get a random number", () => {
      // The hash "fffffdbf53e2c47ca9d00e4603facdbd" has last 8 chars "03facdbd"
      const block = BlockFaker.one({
        hash: "fffffdbf53e2c47ca9d00e4603facdbd",
      });
      expect(Block.getLikelihood(block)).toBeCloseTo(0.0155, 4);
    });

    it("Handles hash with minimum normalized value (all zeros)", () => {
      // Hash ending in "00000000" normalizes to 0.0
      const block = BlockFaker.one({
        hash: "1234567890abcdef12345678900000000",
      });
      const likelihood = Block.getLikelihood(block);
      expect(likelihood).toBe(0);
    });

    it("Handles hash with maximum normalized value (all fs)", () => {
      // Hash ending in "ffffffff" normalizes to exactly 1.0
      const block = BlockFaker.one({
        hash: "1234567890abcdef1234567890ffffffff",
      });
      const likelihood = Block.getLikelihood(block);
      expect(likelihood).toBe(1);
    });
  });
});
