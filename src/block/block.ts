import { faker } from "@faker-js/faker";
import crypto from "crypto";
import { Difficulty } from "../difficulty/difficulty";

export type Block = {
  /** The index of the block in the chain. Genesis block is index 0.*/
  index: number;

  /** The player who mined the block. Format: AAA-ZZZ */
  player: string;

  /** The team that the player is on. Format: AAA-ZZZ */
  team?: string;

  /** The timestamp of the block in seconds. */
  timestamp: number;

  /** The nonce of the block. A number that is incremented until the hash meets the difficulty target. */
  nonce: number;

  /** The hash of the block. A SHA-256 hash of the block's data. */
  hash: string;

  /** The previous hash of the block. A SHA-256 hash of the previous block's data. */
  previousHash: string;

  /** A message associated with the block. */
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

  /** Only the Game.createGenesisBlock() should call this function. */
  createGenesisBlock: (player: string, message?: string): Block => {
    // I think the genesis block for a player has to be mined manually
    const timestamp = Math.floor(Date.now() / 1000);
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

  Faker: {
    one: (overrides: Partial<Block> = {}): Block => {
      return {
        index: 0,
        player: faker.string.alpha(3).toUpperCase(),
        timestamp: faker.date.past().getTime() / 1000,
        nonce: faker.number.int({ min: 0, max: 1000000 }),
        hash: faker.string.hexadecimal({ length: 64 }),
        previousHash: faker.string.hexadecimal({ length: 64 }),
        team: faker.string.alpha(3).toUpperCase(),
        message: faker.lorem.sentence(),
        ...overrides,
      }
    },
    many: (count: number, overrides: (index: number) => Partial<Block> = () => ({})): Block[] => {
      return Array.from({ length: count }, (_, index) => Block.Faker.one(overrides(index)));
    },
  }
};
