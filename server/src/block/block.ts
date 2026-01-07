import { faker } from "@faker-js/faker";
import crypto from "crypto";
import { Difficulty } from "../difficulty/difficulty";
import { Timestamp } from "../timestamp/timestamp";

export type Block = {
  /** The index of the block in the chain. Genesis block is index 0.*/
  index: number;

  /** The player who mined the block. Format: AAA-ZZZ */
  player: string;

  /** The team that the player is on. Format: AAA-ZZZ */
  team: string;

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
  GENESIS_PREVIOUS_HASH: "ffffffffffffffffffffffffffffffff",

  calculateHash: (args: {
    previousHash: string;
    previousTimestamp: number;
    player: string;
    team: string;
    nonce: number;
  }) => {
    const { previousHash, previousTimestamp, player, team, nonce } = args;
    return crypto
      .createHash("sha256")
      .update(
        `${previousHash}${previousTimestamp}${player}${team ?? ""}${nonce}`,
      )
      .digest("hex")
      .substring(0, 32);
  },

  /** Only the generate chain script should call this function. */
  createGenesisBlock: (args: {
    player: string;
    team: string;
    message?: string;
  }): Block => {
    const { player, team, message } = args;
    const timestamp = Timestamp.now();
    let nonce = 0;
    let hash = "";
    while (true) {
      hash = Block.calculateHash({
        previousHash: Block.GENESIS_PREVIOUS_HASH,
        previousTimestamp: 0, // previous timestamp is 0 for genesis block
        player,
        team,
        nonce,
      });
      if (
        Difficulty.isDifficultyMet(hash, Difficulty.DEFAULT_DIFFICULTY_HASH)
      ) {
        break;
      }
      nonce++;
    }

    return {
      hash,
      previousHash: Block.GENESIS_PREVIOUS_HASH,
      player,
      team,
      timestamp,
      nonce,
      index: 0,
      message: message,
    };
  },

  /**
   * @returns a number between 0 and 1 based on the block hash. One
   * means every event happens. Zero means no events happen.
   */
  getLikelihood: (block: Block): number => {
    const last8Digits = block.hash.slice(-8);
    const number = parseInt(last8Digits, 16);
    return number / 0xffffffff;
  },

  Faker: {
    one: (overrides: Partial<Block> = {}): Block => {
      return {
        index: 0,
        player: faker.string.alpha(3).toUpperCase(),
        timestamp: faker.date.past().getTime() / 1000,
        nonce: faker.number.int({ min: 0, max: 1000000 }),
        hash: faker.string.hexadecimal({ length: 32 }),
        previousHash: faker.string.hexadecimal({ length: 32 }),
        team: faker.string.alpha(3).toUpperCase(),
        message: faker.lorem.sentence(),
        ...overrides,
      };
    },
    many: (
      count: number,
      overrides: (index: number) => Partial<Block> = () => ({}),
    ): Block[] => {
      return Array.from({ length: count }, (_, index) =>
        Block.Faker.one(overrides(index)),
      );
    },
  },
};
