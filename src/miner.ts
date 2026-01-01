import { Block } from "./block";
import { Chain } from "./chain";

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
    const previousTimestamp = previousBlock?.timestamp ?? Date.now();
    const difficulty = Chain.calculateDifficulty(recentChain);
    while (true) {
      const currentHash = Block.calculateHash(
        previousHash,
        previousTimestamp,
        player,
        team,
        nonce,
      );
      if (currentHash.startsWith(difficulty)) {
        const block: Block = {
          hash: currentHash,
          previousHash: previousHash,
          player,
          timestamp: Date.now(),
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
