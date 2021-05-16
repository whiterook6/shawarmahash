import { Block, getBlockDifficultyHash } from "../Block";
import {
  calculateDifficulty,
  getAverageDifficulty,
  getAverageInterval,
} from "../Chain";
import { mineChain } from "../Miner";

console.time("chain");
const chain = mineChain(
  100,
  "00000",
  "TIM",
  "",
  (newBlock: Block, index: number) => {
    console.log(`${index}: ${getBlockDifficultyHash(newBlock.previousHash, newBlock.nonce)}`);
  }
);
console.timeEnd("chain");
console.log("Average Difficulty", getAverageDifficulty(chain));
console.log("Average Interval", getAverageInterval(chain));
console.log("New Difficulty", calculateDifficulty(chain));
