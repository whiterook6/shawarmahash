import { Block, calculateHash } from "./block";
import { Chain, calculateDifficulty } from "./chain";

export const mineBlock = (
  previousBlock: Block,
  player: string,
  team: string,
  chain: Chain,
  message?: string,
): Block => {
  let nonce = 0;
  const previousHash = previousBlock.hash;
  const previousTimestamp = previousBlock.timestamp;
  const difficulty = calculateDifficulty(chain);
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
        index: chain.length,
      };
      if (message) {
        block.message = message;
      }
      return block;
    }
    nonce++;
  }
};
