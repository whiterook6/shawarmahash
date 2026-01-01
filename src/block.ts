import crypto from "crypto";

export type Block = {
  index: number;
  player: string;
  team?: string;
  timestamp: number;
  nonce: number;
  hash: string;
  previousHash: string;
  message?: string;
};

export const Block = {
  calculateHash: (
    previousHash: string,
    previousTimestamp: number,
    player: string,
    team: string | undefined,
    nonce: number,
  ) => {
    return crypto
      .createHash("sha256")
      .update(`${previousHash}${previousTimestamp}${player}${team ?? ""}${nonce}`)
      .digest("hex");
  },

  verifyBlockHash: (
    block: Block,
    previousHash: string,
  ) => {
    // Verify that the stored previousHash matches the provided one
    if (block.previousHash !== previousHash) {
      return false;
    }
    // Verify that the block's hash is correctly calculated
    return block.hash === Block.calculateHash(previousHash, block.timestamp, block.player, block.team, block.nonce);
  },

  createGenesisBlock: (player: string): Block => {
    return {
      index: 0,
      hash: "0", // need to calculate the actual first hash, or mine the first legitimate block in the new format without type support
      previousHash: "0000000000000000000000000000000000000000000000000000000000000000",
      player: player,
      timestamp: Date.now(),
      nonce: 0,
    };
  },

  mint: (previousBlock: Block, nonce: number, hash: string ): Block => {
    return {
      index: previousBlock.index + 1,
      hash: hash,
      previousHash: previousBlock.hash,
      player: previousBlock.player,
      timestamp: Date.now(),
      nonce: nonce,
    };
  }
};
