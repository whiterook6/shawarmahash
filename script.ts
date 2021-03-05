import {Block, getBlockDifficultyHash} from "./src/Block";
import {Chain, verifyChain} from "./src/Chain";
import { hashSHA1 } from "./src/Hash";

const targetDifficulty = "0000";

const mine = (previousHash: string, player: string, team: string = ""): Block => {
  let nonce: number = 0;
  let blockDifficultyHash: string;
  do {
    nonce++;
    blockDifficultyHash = getBlockDifficultyHash(previousHash, nonce.toString(16));
  } while (!blockDifficultyHash.startsWith(targetDifficulty));

  const nonceString: string = nonce.toString(16);
  const timestamp = Math.floor(Date.now() / 1000);

  console.log(`Block found: sha1(${previousHash}, ${nonceString}) = ${blockDifficultyHash}`);
  return {
    previousHash,
    nonce: nonceString,
    player,
    team,
    timestamp,
    hashCode: hashSHA1(`${previousHash}${player}${team}${nonceString}${timestamp}`)
  } as Block;
};

const run = () => {
  const player = "TIM";
  const team = "TUT";
  const chain: Chain = [
    mine("0", player, team)
  ];

  while (chain.length < 50){
    const mostRecentBlock = chain[chain.length - 1];
    const block = mine(mostRecentBlock.hashCode, player, team);
    chain.push(block);
  }

  verifyChain(chain, targetDifficulty);
  console.log(chain);
}

run();