import { Block, getBlockDifficultyHash, mint } from "./Block";
import { Chain } from "./Chain";

/** take an unfinished or easy block and give it enough work to finalize it. */
export const mine = (
  previousHash: string,
  target: string,
  player: string,
  team: string = ""
): Block => {
  let nonce = Math.floor(Math.random() * 1000000);
  const startingNonce = nonce;
  console.time("mining");
  while (
    !getBlockDifficultyHash(previousHash, nonce.toString(16)).startsWith(target)
  ) {
    nonce++;
  }

  console.timeEnd("mining");
  console.log(`From ${startingNonce} to ${nonce}: ${nonce - startingNonce} hashes.`);
  return mint(previousHash, nonce.toString(16), player, team);
};

export const mineChain = (
  desiredLength: number,
  target: string,
  player: string,
  team: string = "",
  callback?: (newBlock: Block, index: number) => any
) => {
  const chain: Chain = [];
  while (chain.length < desiredLength) {
    const previousHash =
      chain.length > 0 ? chain[chain.length - 1].hashCode : "0";
    const newBlock = mine(previousHash, target, player, team);
    if (callback) {
      callback(newBlock, chain.length + 1);
    }
    chain.push(newBlock);
  }
  return chain;
};
