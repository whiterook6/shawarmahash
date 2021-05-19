import { Block, getBlockDifficultyHash } from "../Block";
import {
  calculateDifficulty,
  getAverageDifficulty,
  getAverageInterval,
  verifyChain,
} from "../Chain";
import { mineChain } from "../Miner";
import { saveChain } from "../Serialize";

console.time("chain");
const chain = mineChain(
  100,
  "00000",
  "TIM",
  "",
  (newBlock: Block, index: number) => {
    console.log(
      `${index}: ${getBlockDifficultyHash(
        newBlock.previousHash,
        newBlock.nonce
      )}`
    );
  }
);
console.timeEnd("chain");
console.log("Average Difficulty", getAverageDifficulty(chain));
console.log("Average Interval", getAverageInterval(chain));
console.log("New Difficulty", calculateDifficulty(chain));
verifyChain(chain, "00000");

saveChain(chain).then(() => process.exit(0)).catch(console.error);