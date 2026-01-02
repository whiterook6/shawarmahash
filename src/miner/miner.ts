import { Block } from "../block/block";
import { Chain } from "../chain/chain";
import { Difficulty } from "../difficulty/difficulty";

export const Miner = {
  mineBlock: (
    player: string,
    team: string | undefined,
    recentChain: Chain,
    message?: string,
  ): Block => {
    let nonce = 0;
    const previousBlock = recentChain[recentChain.length - 1];
    const previousHash = previousBlock?.hash ?? "0";
    const previousTimestamp =
      previousBlock?.timestamp ?? Math.floor(Date.now() / 1000);
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
          timestamp: Math.floor(Date.now() / 1000),
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
