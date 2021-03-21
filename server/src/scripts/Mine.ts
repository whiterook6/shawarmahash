import { Block } from "../Block";
import {
  calculateDifficulty,
  getAverageDifficulty,
  getAverageInterval,
} from "../Chain";
import { mineChain } from "../Miner";

const chain = mineChain(
  100,
  "000000",
  "TIM",
  "",
  (newBlock: Block, index: number) => {
    console.log(index);
  }
);
console.log("Average Difficulty", getAverageDifficulty(chain));
console.log("Average Interval", getAverageInterval(chain));
console.log("New Difficulty", calculateDifficulty(chain));
