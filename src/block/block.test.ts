import expect from "expect";
import { describe, it } from "node:test";
import { Block } from "./block";

describe("Block", () => {
  describe("calculateHash", () => {
    it("It can calculate a hash", () => {
      const expectedHash =
        "000008840290f0cef37278c9df927ed079d61820435eaefdaaec56becf0d4ac5";
      const previousHash =
        "00000fa57463d5688280378c5c60c9d025e2a34df0f5d3bcc607809d56ddb10e";
      const actualHash = Block.calculateHash(
        previousHash,
        1767378644,
        "AAA",
        undefined,
        65107,
      );
      expect(actualHash).toEqual(expectedHash);
    });

    it("It can calculate a hash with a team", () => {
      const expectedHash =
        "00000f67bbe633a07efb5c2fccd8983fad091d39c903ee36b008dc7fba089d95";
      const previousHash =
        "00000c3a24a32feb68a8442c10d80e4877e24f518e757eace69cfa0a1ba42c48";
      const actualHash = Block.calculateHash(
        previousHash,
        1767378658,
        "BBB",
        "TTT",
        177300,
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
          previousHash:
            "0000000000000000000000000000000000000000000000000000000000000000",
          index: 0,
          timestamp: expect.any(Number),
          nonce: expect.any(Number),
        }),
      );

      const expectedHash = genesisBlock.hash;
      const toEqualHash = Block.calculateHash(
        "0000000000000000000000000000000000000000000000000000000000000000",
        0,
        "AAA",
        undefined,
        genesisBlock.nonce,
      );
      expect(expectedHash).toEqual(toEqualHash);
    });
  });
});
