import { Block } from "../block/block";
import { Chain } from "../chain/chain";
import { Difficulty } from "../difficulty/difficulty";
import { Timestamp } from "../timestamp/timestamp";

export const Miner = {
  findHash: (args: {
    difficultyTarget: string;
    previousHash: string;
    previousTimestamp: number;
    player: string;
    team: string;
  }): {
    hash: string;
    nonce: number;
  } => {
    const { difficultyTarget, previousHash, previousTimestamp, player, team } =
      args;
    let nonce = 0;
    while (true) {
      const currentHash = Block.calculateHash({
        previousHash,
        previousTimestamp,
        player,
        team,
        nonce,
      });
      if (Difficulty.isDifficultyMet(currentHash, difficultyTarget)) {
        return { hash: currentHash, nonce };
      }
      nonce++;
    }
  },

  mineBlock: (
    recentChain: Chain,
    args: {
      player: string;
      team: string;
      identity: string;
      message?: string;
    },
  ): Block => {
    const { player, team, identity, message } = args;
    if (recentChain.length === 0) {
      throw new Error("Cannot mine block on empty chain");
    }

    const previousBlock = recentChain[recentChain.length - 1];
    const previousHash = previousBlock.hash;
    const previousTimestamp = previousBlock.timestamp;
    const difficultyTarget =
      Difficulty.getDifficultyTargetFromChain(recentChain);
    const { hash, nonce } = Miner.findHash({
      difficultyTarget,
      previousHash,
      previousTimestamp,
      player,
      team,
    });
    const newBlock: Block = {
      hash,
      previousHash,
      player,
      team,
      timestamp: Timestamp.now(),
      nonce,
      index: previousBlock.index + 1,
      identity,
    };
    if (message) {
      newBlock.message = message;
    }
    return newBlock;
  },
};
