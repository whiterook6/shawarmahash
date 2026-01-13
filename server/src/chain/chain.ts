import { Block } from "../block/block";
import { Difficulty } from "../difficulty/difficulty";
import { ValidationError } from "../error/errors";
import { Timestamp } from "../timestamp/timestamp";

export type Chain = Block[];

export const Chain = {
  getAverageMiningInterval: (chain: Chain): number => {
    const length = chain.length;
    if (length < 2) {
      return 0;
    }

    // Timestamps are in seconds
    const elapsedSeconds = Math.max(
      0,
      chain[length - 1].timestamp - chain[0].timestamp,
    );
    return elapsedSeconds / length;
  },

  verifyGenesisBlock: (genesisBlock: Block): string | undefined => {
    if (genesisBlock.index !== 0) {
      return "Genesis block must have index 0";
    }

    // Verify genesis block has the correct previousHash
    if (genesisBlock.previousHash !== Block.GENESIS_PREVIOUS_HASH) {
      return "Genesis block must have correct previousHash";
    }

    // verify the genesis block meets the starting difficulty
    if (
      !Difficulty.isDifficultyMet(
        genesisBlock.hash,
        Difficulty.DEFAULT_DIFFICULTY_HASH,
      )
    ) {
      return `Genesis block does not meet difficulty requirement: ${genesisBlock.hash} does not start with ${Difficulty.DEFAULT_DIFFICULTY_HASH}`;
    }

    // verify the genesis block has the correct hash
    const expectedGenesisHash = Block.calculateHash({
      previousHash: Block.GENESIS_PREVIOUS_HASH,
      previousTimestamp: 0,
      player: genesisBlock.player,
      team: genesisBlock.team,
      nonce: genesisBlock.nonce,
    });
    if (genesisBlock.hash !== expectedGenesisHash) {
      return "Genesis block must have correct hash";
    }
  },

  verifyChain: (chain: Chain): string | undefined => {
    // Empty chain is invalid
    if (chain.length === 0) {
      return "Empty chain is invalid";
    }

    // Verify genesis block (index 0)
    const genesisBlock = chain[0];
    const genesisBlockVerificationError =
      Chain.verifyGenesisBlock(genesisBlock);
    if (genesisBlockVerificationError) {
      return genesisBlockVerificationError;
    }

    // Verify each subsequent block
    for (let i = 1; i < chain.length; i++) {
      const currentBlock = chain[i];
      const previousBlock = chain[i - 1];

      // Check index is sequential
      if (currentBlock.index !== i) {
        return `Block ${i} has incorrect index: ${currentBlock.index}`;
      }

      // Verify previousHash matches the actual previous block's hash
      if (currentBlock.previousHash !== previousBlock.hash) {
        return `Block ${i} has incorrect previous hash: ${currentBlock.previousHash} !== ${previousBlock.hash}`;
      }

      // Calculate expected hash
      const expectedHash = Block.calculateHash({
        previousHash: previousBlock.hash,
        previousTimestamp: previousBlock.timestamp,
        player: currentBlock.player,
        team: currentBlock.team,
        nonce: currentBlock.nonce,
      });

      // Verify hash matches
      if (currentBlock.hash !== expectedHash) {
        return `Block ${i} has incorrect hash: ${currentBlock.hash} !== ${expectedHash}`;
      }

      // Verify hash meets difficulty requirement
      // Calculate difficulty that would have been used when mining this block
      const requiredDifficulty = Difficulty.getDifficultyTargetFromChain(
        chain.slice(0, i),
      );

      if (!Difficulty.isDifficultyMet(currentBlock.hash, requiredDifficulty)) {
        return `Block ${i} does not meet difficulty requirement: ${currentBlock.hash} does not start with ${requiredDifficulty}`;
      }
    }
  },

  verifyIncomingBlock: (
    args: {
      previousHash: string;
      player: string;
      team: string;
      nonce: number;
      hash: string;
      message?: string;
    },
    chain: Chain,
  ): Block => {
    if (chain.length === 0) {
      throw new ValidationError({
        chain: ["Chain is empty"],
      });
    }

    const { previousHash, player, team, nonce, hash, message } = args;
    const previousBlock = chain[chain.length - 1];
    if (previousHash !== previousBlock.hash) {
      throw new ValidationError({
        previousHash: [
          `Invalid previous hash: ${previousHash} !== ${previousBlock.hash}`,
        ],
      });
    } else if (team !== previousBlock.team) {
      throw new ValidationError({
        team: [`Invalid team: ${team} !== ${previousBlock.team}`],
      });
    }

    // verify the provided hash is correct
    const newBlockhash = Block.calculateHash({
      team,
      player,
      previousHash: previousBlock.hash,
      previousTimestamp: previousBlock.timestamp,
      nonce,
    });
    if (hash !== newBlockhash) {
      throw new ValidationError({
        blockHash: [`Invalid block hash: ${hash}  !== ${newBlockhash}`],
      });
    }

    // Verify the hash meets difficulty requirement
    const difficultyTarget = Difficulty.getDifficultyTargetFromChain(chain);
    if (!Difficulty.isDifficultyMet(newBlockhash, difficultyTarget)) {
      throw new ValidationError({
        blockHash: [
          `Block does not meet difficulty requirement: ${newBlockhash} does not start with ${difficultyTarget}`,
        ],
      });
    }

    const newBlock: Block = {
      hash,
      previousHash,
      player,
      team,
      timestamp: Timestamp.now(),
      nonce,
      index: previousBlock.index + 1,
    };

    if (message) {
      newBlock.message = message;
    }

    return newBlock;
  },
};
