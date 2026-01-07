import { Block } from "../block/block";
import { Chain } from "../chain/chain";
import { Difficulty } from "../difficulty/difficulty";
import { Timestamp } from "../timestamp/timestamp";

export const Miner = {
  mineBlock: (
    player: string,
    team: string | undefined,
    recentChain: Chain,
    message?: string,
  ): Block => {
    if (recentChain.length === 0) {
      throw new Error("Cannot mine block on empty chain");
    }
    let nonce = 0;
    const previousBlock = recentChain[recentChain.length - 1];
    const previousHash = previousBlock.hash;
    const previousTimestamp = previousBlock.timestamp;
    const difficulty = Difficulty.getDifficultyTargetFromChain(recentChain);
    while (true) {
      const currentHash = Block.calculateHash(
        previousHash,
        previousTimestamp,
        player,
        team,
        nonce,
      );
      if (Difficulty.isDifficultyMet(currentHash, difficulty)) {
        const block: Block = {
          hash: currentHash,
          previousHash: previousHash,
          player,
          timestamp: Timestamp.now(),
          nonce,
          index: previousBlock ? previousBlock.index + 1 : 0,
        };
        if (team) {
          block.team = team;
        }
        if (message) {
          block.message = message;
        }
        return block;
      }
      nonce++;
    }
  },
};
