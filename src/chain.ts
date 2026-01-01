import { Block } from "./block";
import { Difficulty } from "./difficulty";

export type Chain = Block[];

export const Chain = {
  getAverageMiningInterval: (chain: Chain): number => {
    const length = chain.length;
    if (length < 2) {
      return 0;
    }

    const elapsedSeconds = chain[length - 1].timestamp - chain[0].timestamp;
    return elapsedSeconds / length;
  },

  verifyChain: (chain: Chain): boolean => {
    // Empty chain is invalid
    if (chain.length === 0) {
      return false;
    }

    // Verify genesis block (index 0)
    const genesisBlock = chain[0];
    if (genesisBlock.index !== 0) {
      return false;
    }

    // Verify genesis block has the correct previousHash
    if (
      genesisBlock.previousHash !==
      "0000000000000000000000000000000000000000000000000000000000000000"
    ) {
      return false;
    }

    // Verify each subsequent block
    for (let i = 1; i < chain.length; i++) {
      const currentBlock = chain[i];
      const previousBlock = chain[i - 1];

      // Check index is sequential
      if (currentBlock.index !== i) {
        return false;
      }

      // Check timestamp is valid (current >= previous)
      if (currentBlock.timestamp < previousBlock.timestamp) {
        return false;
      }

      // Verify previousHash matches the actual previous block's hash
      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
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
        return false;
      }

      // Verify hash meets difficulty requirement
      // Calculate difficulty that would have been used when mining this block
      const requiredDifficulty = Difficulty.getDifficultyTargetFromChain(chain);

      if (!Difficulty.isDifficultyMet(currentBlock.hash, requiredDifficulty)) {
        return false;
      }
    }

    return true;
  },
};
