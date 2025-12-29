import { Block, calculateHash } from "./block";
import { Chain, calculateDifficulty } from "./chain";

export const mineBlock = (previousBlock: Block, player: string, chain: Chain): Block => {
  let nonce = 0;
  const previousHash = previousBlock.hash;
  const previousTimestamp = previousBlock.timestamp;
  const difficulty = calculateDifficulty(chain);
  while (true) {
    const currentHash = calculateHash(previousHash, previousTimestamp, player, nonce.toString(16));
    if (currentHash.startsWith(difficulty)) {
      return {
        hash: currentHash,
        player,
        timestamp: Date.now(),
        nonce: nonce.toString(16),
        index: chain.length,
      };
    }
    nonce++;
  }
};

