import { hashSHA1 } from "./Hash";
export const blockNameRegex = /[a-zA-Z0-9][a-zA-Z0-9][a-zA-Z0-9]/;

export interface Block {
  /** 40 hexadecimal characters, or "0" if it's the first block in the chain. */
  previousHash: string;

  /** at least 1 hex character. */
  nonce: string;

  /** either an empty string (""), or 3 [a-zA-Z0-9] characters */
  team: string;

  /** 3 [a-zA-Z0-9] characters */
  player: string;

  /** number of seconds since epoch. */
  timestamp: number;

  /**
   * 40 hexadecimal characters. run getBlockHash() or mint().
   **/
  hashCode: string;
}

export const getBlockHash = (block: Block): string => {
  return hashSHA1(
    `${block.previousHash}${block.player}${block.team}${block.nonce}${block.timestamp}`
  );
};

export const getBlockDifficultyHash = (
  previousHash: string,
  nonce: string
): string => {
  return hashSHA1(`${previousHash}${nonce}`);
};

/**
 * @param averageTimestamp An average of the past ten timestamps, so that the rolling average is always increasing to the future.
 * Can also be any timestamp the server chooses, in case there's no good average to pull from--for example, the first ten blocks.
 */
export const verifyBlock = (
  block: Block,
  previousBlockHash: string,
  averageTimestamp: number,
  targetDifficulty: string
) => {
  if (block.previousHash !== previousBlockHash) {
    throw new Error(
      `Invalid previous block hash. Expected ${previousBlockHash}, got ${block.previousHash}`
    );
  } else if (block.team && !blockNameRegex.test(block.team)) {
    throw new Error(`Invalid team name: ${block.team}`);
  } else if (!blockNameRegex.test(block.player)) {
    throw new Error(`Invalid player name: ${block.player}`);
  } else if (block.timestamp < averageTimestamp) {
    throw new Error(
      `Timestamp is too far in the past. Average timestamp is ${averageTimestamp.toFixed(
        1
      )}, actual is ${block.timestamp}.`
    );
  }

  const blockDifficultyHash = getBlockDifficultyHash(
    block.previousHash,
    block.nonce
  );
  if (!blockDifficultyHash.startsWith(targetDifficulty)) {
    throw new Error(
      `Block doesn't meet target difficulty: sha1(${block.previousHash}${block.nonce}) = ${blockDifficultyHash}`
    );
  }

  const blockHash = getBlockHash(block);
  if (blockHash !== block.hashCode) {
    console.log(block);
    throw new Error(
      `Hashcode doesn't match hashed contents. Expected ${block.hashCode}, got ${blockHash}.`
    );
  }
};

export const mint = (
  previousHash: string,
  nonce: string,
  player: string,
  team: string = ""
) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const hashCode = hashSHA1(
    `${previousHash}${player}${team}${nonce}${timestamp}`
  );

  return {
    previousHash,
    nonce,
    player,
    team,
    timestamp,
    hashCode,
  } as Block;
};
