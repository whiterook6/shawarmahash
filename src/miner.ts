import { Block, calculateHash } from "./block";
import { Chain, calculateDifficulty } from "./chain";

export const mineBlock = (
  player: string,
  team: string,
  recentChain: Chain,
  message?: string,
): Block => {
  let nonce = 0;
  const previousBlock = recentChain[recentChain.length - 1];
  const previousHash = previousBlock?.hash ?? "0";
  const previousTimestamp = previousBlock?.timestamp ?? Date.now();
  const difficulty = calculateDifficulty(recentChain);
  while (true) {
    const currentHash = calculateHash(
      previousHash,
      previousTimestamp,
      player,
      team,
      nonce,
    );
    if (currentHash.startsWith(difficulty)) {
      const block: Block = {
        hash: currentHash,
        player,
        team,
        timestamp: Date.now(),
        nonce,
        index: previousBlock ? previousBlock.index + 1 : 0,
      };
      if (message) {
        block.message = message;
      }
      return block;
    }
    nonce++;
  }
};
