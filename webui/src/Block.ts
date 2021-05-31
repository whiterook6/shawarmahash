import { sha1 } from "sha.js";

const hashSHA1 = (input: string): string => {
  return new sha1().update(input).digest("hex");
};

export interface Block {
  /** 40 hexadecimal characters, or "0" if it's the first block in the chain. */
  previousHash: string;

  /** at least 1 hex character. */
  nonce: string;

  /** either an empty string (""), or three ascii characters */
  team: string;

  /** three ascii characters */
  player: string;

  /** number of seconds since epoch. */
  timestamp: number;

  /**
   * 40 hexadecimal characters. run getBlockHash() or mint().
   **/
  hashCode: string;
}

export type Chain = Block[];

export const getBlockHash = (block: {
  previousHash: string;
  nonce: string;
  team: string;
  player: string;
  timestamp: number;
}): string => {
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

export const verifyBlock = (
  block: Block,
  previousBlockHash: string,
  timestamp: number,
  targetDifficulty: string
) => {
  if (block.previousHash !== previousBlockHash) {
    throw new Error(
      `Invalid previous block hash. Expected ${previousBlockHash}, got ${block.previousHash}`
    );
  } else if (block.team && block.team.length !== 3) {
    throw new Error("Invalid team name.");
  } else if (block.player.length !== 3) {
    throw new Error("Invalid player name.");
  } else if (Math.abs(timestamp - block.timestamp) > 3600) {
    throw new Error("Timestamp is too far in the future or past.");
  }

  const blockDifficultyHash = getBlockDifficultyHash(
    block.previousHash,
    block.nonce
  );
  if (blockDifficultyHash > targetDifficulty) {
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
