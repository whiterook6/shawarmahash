import { Block, getBlockDifficultyHash, mint } from "./src/Block";
import { appendBlock, Chain, verifyChain } from "./src/Chain";
import { getPlayers, getPlayerScores, getTeams, getTeamScores } from "./src/Scoreboard";

const targetDifficulty = "0000";
let hashes = 0;
const mine = (previousHash: string, player: string, team: string = ""): Block => {
  let nonce: number = Math.floor(Math.random() * 100000000);
  let blockDifficultyHash: string;
  do {
    nonce++;
    blockDifficultyHash = getBlockDifficultyHash(previousHash, nonce.toString(16));
    hashes++;
  } while (!blockDifficultyHash.startsWith(targetDifficulty));
  const nonceString: string = nonce.toString(16);
  console.log(`Block found: sha1(${previousHash}, ${nonceString}) = ${blockDifficultyHash}`);
  return mint(
    previousHash,
    nonceString,
    player,
    team
  );
};

const run = () => {
  const startTime = Date.now();
  const player = "TIM";
  const team = "TUT";
  const chain: Chain = [
    mine("0", player, team)
  ];

  while (chain.length < 100){
    const mostRecentBlock = chain[chain.length - 1];
    const block = mine(mostRecentBlock.hashCode, player, team);
    appendBlock(chain, block);
  }
  const endTime = Date.now();
  const dtSeconds = (endTime - startTime)/1000;
  verifyChain(chain, targetDifficulty);
  
  console.log(chain);
  console.log(`Hash Rate: ${hashes} hashes in ${dtSeconds} seconds: ${(hashes/dtSeconds).toFixed(2)}H/s`);

  console.log(`Players: ${getPlayers(chain).join(", ")}`);
  console.log("Player scores: ");
  console.log(getPlayerScores(chain));
  console.log(`Teams: ${getTeams(chain).join(", ")}`);
  console.log("Team Scores:");
  console.log(getTeamScores(chain));
}

run();