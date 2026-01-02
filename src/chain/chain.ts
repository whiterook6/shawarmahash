import { Block } from "../block/block";
import { Difficulty } from "../difficulty/difficulty";

export type Chain = Block[];

export const Chain = {
  getAverageMiningInterval: (chain: Chain): number => {
    const length = chain.length;
    if (length < 2) {
      return 0;
    }

    // Timestamps are in seconds
    const elapsedSeconds = chain[length - 1].timestamp - chain[0].timestamp;
    return elapsedSeconds / length;
  },

  verifyChain: (chain: Chain): string | undefined => {
    // Empty chain is invalid
    if (chain.length === 0) {
      return "Empty chain is invalid";
    }

    // Verify genesis block (index 0)
    const genesisBlock = chain[0];
    if (genesisBlock.index !== 0) {
      return "Genesis block must have index 0";
    }

    // Verify genesis block has the correct previousHash
    if (
      genesisBlock.previousHash !==
      "0000000000000000000000000000000000000000000000000000000000000000"
    ) {
      return "Genesis block must have correct previousHash";
    }

    // Verify each subsequent block
    for (let i = 1; i < chain.length; i++) {
      const currentBlock = chain[i];
      const previousBlock = chain[i - 1];

      // Check index is sequential
      if (currentBlock.index !== i) {
        return `Block ${i} has incorrect index: ${currentBlock.index}`;
      }

      // Check timestamp is valid (current >= previous)
      if (currentBlock.timestamp < previousBlock.timestamp) {
        return `Block ${i} has incorrect timestamp: ${currentBlock.timestamp} < ${previousBlock.timestamp}`;
      }

      // Verify previousHash matches the actual previous block's hash
      if (currentBlock.previousHash !== previousBlock.hash) {
        return `Block ${i} has incorrect previousHash: ${currentBlock.previousHash} !== ${previousBlock.hash}`;
      }

      // Calculate expected hash
      const expectedHash = Block.calculateHash(
        previousBlock.hash,
        previousBlock.timestamp,
        currentBlock.player,
        currentBlock.team,
        currentBlock.nonce,
      );

      // Verify hash matches
      if (currentBlock.hash !== expectedHash) {
        return `Block ${i} has incorrect hash: ${currentBlock.hash} !== ${expectedHash}`;
      }

      // Verify hash meets difficulty requirement
      // Calculate difficulty that would have been used when mining this block
      const requiredDifficulty = Difficulty.getDifficultyTargetFromChain(chain);

      if (!Difficulty.isDifficultyMet(currentBlock.hash, requiredDifficulty)) {
        return `Block ${i} does not meet difficulty requirement: ${currentBlock.hash} does not start with ${requiredDifficulty}`;
      }
    }
  },
};
