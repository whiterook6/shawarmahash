import Miner from "worker-loader!./Worker";
import { Block } from "./Block";

let webWorker: Miner | undefined = new Miner();
const startBlock = (previousHash: string) => {
  return {
    hashCode: "",
    nonce: "",
    player: "TIM",
    team: "TUT",
    previousHash,
    timestamp: Math.floor(Date.now() / 1000)
  } as Block;
}

let previousBlock: Block = startBlock("0");

webWorker.onmessage = (event: MessageEvent) => {
  const block: Block = event.data;
  console.log(JSON.stringify(block));

  previousBlock = startBlock(block.hashCode);
  webWorker.postMessage(previousBlock);
}

webWorker.postMessage(previousBlock);
