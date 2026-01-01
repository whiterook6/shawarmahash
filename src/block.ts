import crypto from "crypto";
import { Difficulty } from "./difficulty";

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
      .update(
        `${previousHash}${previousTimestamp}${player}${team ?? ""}${nonce}`,
      )
      .digest("hex");
  },

  verifyBlockHash: (block: Block, previousHash: string) => {
    // Verify that the stored previousHash matches the provided one
    if (block.previousHash !== previousHash) {
      return false;
    }
    // Verify that the block's hash is correctly calculated
    return (
      block.hash ===
      Block.calculateHash(
        previousHash,
        block.timestamp,
        block.player,
        block.team,
        block.nonce,
      )
    );
  },

  /** Only the Game.createGenesisBlock() should call this function. */
  createGenesisBlock: (player: string, message?: string): Block => {
    // I think the genesis block for a player has to be mined manually
    const timestamp = Date.now();
    let nonce = 0;
    let hash = "";
    while (true) {
      hash = Block.calculateHash(
        "0000000000000000000000000000000000000000000000000000000000000000",
        timestamp,
        player,
        undefined,
        nonce,
      );
      if (
        Difficulty.isDifficultyMet(hash, Difficulty.DEFAULT_DIFFICULTY_HASH)
      ) {
        break;
      }
      nonce++;
    }
    return {
      hash: hash,
      previousHash:
        "0000000000000000000000000000000000000000000000000000000000000000",
      player: player,
      timestamp: timestamp,
      nonce: nonce,
      index: 0,
      message: message,
    };
  },

  mint: (previousBlock: Block, nonce: number, hash: string): Block => {
    return {
      index: previousBlock.index + 1,
      hash: hash,
      previousHash: previousBlock.hash,
      player: previousBlock.player,
      timestamp: Date.now(),
      nonce: nonce,
    };
  },
};
