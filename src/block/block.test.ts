import expect from "expect";
import assert from "node:assert";
import { describe, it } from "node:test";
import { Block } from "./block";

describe("Block", () => {
  it("Can calculate a hash", () => {
    const expectedHash =
      "6a86f3dc2d6ac0aafd6d3f6fecf4ad41b5788e1ed2dcb70340550401c5b63e91";
    const previousHash =
      "1a1cc3c9070e0914c7955c6310ab69f8556036c06b67a9b2df05b8ea22ea9be6";
    const actualHash = Block.calculateHash(
      previousHash,
      1735594900,
      "AAA",
      "AAA",
      0,
    );
    assert.strictEqual(actualHash, expectedHash);
  });

  it("can create a genesis block", () => {
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
  });

  it("Can verify a block hash", () => {
    const previousHash =
      "1a1cc3c9070e0914c7955c6310ab69f8556036c06b67a9b2df05b8ea22ea9be6";
    const goodBlock = {
      index: 1,
      player: "AAA",
      team: "AAA",
      timestamp: 1735594900,
      nonce: 0,
      hash: "294ba4c5895004b065e576f7c73f833ef050bd2246e4e564315827ea752133cd",
      previousHash: previousHash,
    };
    assert.strictEqual(Block.verifyBlockHash(goodBlock, previousHash), true);
    const badBlock = {
      index: 1,
      player: "AAA",
      team: "AAA",
      timestamp: 1735594900,
      nonce: 0,
      hash: "895004b065e576",
      previousHash:
        "0000000000000000000000000000000000000000000000000000000000000000",
    };
    assert.strictEqual(Block.verifyBlockHash(badBlock, previousHash), false);
  });
});
