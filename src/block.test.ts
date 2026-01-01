import { describe, it } from "node:test";
import assert from "node:assert";
import expect from "expect";
import { Block } from "./block";

describe("Block", () => {
  it("Can calculate a hash", () => {
    const expectedHash =
      "294ba4c5895004b065e576f7c73f833ef050bd2246e4e564315827ea752133cd";
    const previousHash = "1a1cc3c9070e0914c7955c6310ab69f8556036c06b67a9b2df05b8ea22ea9be6";
    const actualHash = Block.calculateHash(
      previousHash,
      1735594900000,
      "AAA",
      "AAA",
      0,
    );
    assert.strictEqual(actualHash, expectedHash);
  });

  it("can create a genesis block", () => {
    const genesisBlock = Block.createGenesisBlock("AAA");
    expect(genesisBlock).toEqual(expect.objectContaining({
      player: "AAA",
      hash: "0",
      previousHash: "0000000000000000000000000000000000000000000000000000000000000000",
      index: 0,
      timestamp: expect.any(Number),
      nonce: 0,
    }));
  });

  it("Can verify a block hash", () => {
    const previousHash = "1a1cc3c9070e0914c7955c6310ab69f8556036c06b67a9b2df05b8ea22ea9be6";
    const block = {
      index: 1,
      player: "AAA",
      team: "AAA",
      timestamp: 1735594900000,
      nonce: 0,
      hash: "294ba4c5895004b065e576f7c73f833ef050bd2246e4e564315827ea752133cd",
      previousHash: previousHash,
    };
    const isValid = Block.verifyBlockHash(block, previousHash);
    assert.strictEqual(isValid, true);
  });
});
