import { Block, verifyBlock } from "./Block";
import { hashSHA1 } from "./Hash";

export type Chain = Block[];

export const getAverageTimestamp = (chain: Chain, fallback: number): number => {
  if (chain.length < 10){
    return fallback;
  } else {
    return chain.slice(-10).reduce((previous, current) => previous + current.timestamp, 0) / 10;
  }
}

export const verifyChain = (chain: Chain, targetDifficulty: string) => {
  if (chain.length === 0) {
    return;
  }

  let previousBlockHash = "0";
  for (let index = 0; index < chain.length; index++) {
    const block = chain[index];
    const averageBlockTimestamp = getAverageTimestamp(chain.slice(0, index + 1), 0);
    
    verifyBlock(
      block,
      previousBlockHash,
      averageBlockTimestamp,
      targetDifficulty
    );

    previousBlockHash = block.hashCode;
  }
};

export const appendBlock = (chain: Chain, block: Block): Chain => {
  if (chain.length === 0) {
    return [block];
  }

  const top = chain[chain.length - 1];
  const topHash = top.hashCode;
  if (block.previousHash !== topHash) {
    throw new Error(
      `Cannot append to chain: previous hash mismatch. Expected ${topHash}, got ${block.previousHash}`
    );
  }

  chain.push(block);
  return chain;
};

const requiredStringFields = ["hashCode", "nonce", "player", "previousHash"];

export const verifyIncomingBlock = (
  chain: Chain,
  proposedBlock: any,
  targetDifficulty: string
) => {
  for (const field of requiredStringFields) {
    if (!proposedBlock.hasOwnProperty(field) || !proposedBlock[field]) {
      throw new Error(`Invalid block: missing ${field}.`);
    } else if (typeof proposedBlock[field] !== "string") {
      throw new Error(`Invalid block: malformed ${field}.`);
    }
  }

  if (
    proposedBlock.hasOwnProperty("team") &&
    typeof proposedBlock.team !== "string"
  ) {
    throw new Error(`Invalid block: malformed team.`);
  }

  if (!proposedBlock.hasOwnProperty("timestamp")) {
    throw new Error("Invalid block: no timestamp.");
  } else if (typeof proposedBlock.timestamp !== "number") {
    throw new Error("Invalid block: malformed timestamp.");
  }

  const block: Block = {
    hashCode: proposedBlock.hashCode,
    nonce: proposedBlock.nonce,
    player: proposedBlock.player,
    previousHash: proposedBlock.previousHash,
    team: proposedBlock.team || "",
    timestamp: proposedBlock.timestamp,
  };

  let previousBlockHash = "0";
  if (chain.length > 0) {
    const top = chain[chain.length - 1];
    previousBlockHash = top.hashCode;
  }

  const averageTimestamp = getAverageTimestamp(chain, 0);

  verifyBlock(
    block,
    previousBlockHash,
    averageTimestamp,
    targetDifficulty
  );
  return block;
};

export const getAverageDifficulty = (chain: Chain): number => {
  if (chain.length === 0) {
    return 1;
  }

  return (
    chain.reduce((previous: number, current: Block) => {
      const difficultyHash = hashSHA1(
        `${current.previousHash}${current.nonce}`
      );
      let leadingZeroes;
      for (
        leadingZeroes = 0;
        leadingZeroes < difficultyHash.length;
        leadingZeroes++
      ) {
        if (difficultyHash[leadingZeroes] !== "0") {
          break;
        }
      }
      return previous + leadingZeroes;
    }, 0) / chain.length
  );
};

export const getAverageInterval = (chain: Chain): number => {
  const length = chain.length;
  if (length < 2) {
    return 0;
  }

  const elapsedSeconds = chain[length - 1].timestamp - chain[0].timestamp;
  return elapsedSeconds / length;
};

const desiredIntervalInSeconds = 30;
export const calculateDifficulty = (previousBlocks: Chain): string => {
  if (previousBlocks.length < 100) {
    return "00000";
  }

  let oneHundredBlocks;
  if (previousBlocks.length === 100) {
    oneHundredBlocks = previousBlocks;
  } else {
    oneHundredBlocks = previousBlocks.slice(-100);
  }

  const averageDifficulty = getAverageDifficulty(oneHundredBlocks);
  const averageIntervalInSeconds = Math.max(
    1,
    getAverageInterval(oneHundredBlocks)
  );
  const totalOps = Math.pow(16, averageDifficulty);
  console.log(`Estimated total ops: ${totalOps.toFixed(2)}`);
  const opsPerSecond = totalOps / averageIntervalInSeconds;
  console.log(`Ops per second: ${opsPerSecond.toFixed(5)}`);
  const newDifficulty =
    Math.log(opsPerSecond * desiredIntervalInSeconds) / Math.log(16);
  console.log(`newDifficulty: ${newDifficulty.toFixed(4)}`);
  return "".padStart(newDifficulty, "0");
};
