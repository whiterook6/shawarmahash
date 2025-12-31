import { describe, it } from "node:test";
import assert from "node:assert";
import { calculateHash } from "./block";

describe("Block", () => {
  it("Can calculate a hash", () => {
    const expectedHash =
      "294ba4c5895004b065e576f7c73f833ef050bd2246e4e564315827ea752133cd";
    const actualHash = calculateHash(
      "1a1cc3c9070e0914c7955c6310ab69f8556036c06b67a9b2df05b8ea22ea9be6",
      1735594900000,
      "AAA",
      "AAA",
      0,
    );
    assert.strictEqual(actualHash, expectedHash);
  });
});
