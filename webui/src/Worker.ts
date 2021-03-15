import { sha1 } from "sha.js";
import { Block } from "./Block";
const ctx: Worker = self as any;

onmessage = (message) => {
  const block: Block = message.data;
  const previousHash = block.previousHash;

  let nonce = Math.floor(Math.random() * 1000000);
  let difficultyHash;
  while (true){
    const nonceString = (nonce++).toString(16);
    difficultyHash = new sha1().update(`${previousHash}${nonceString}`).digest("hex");
    
    if (difficultyHash.startsWith("00000")) {
      block.nonce = nonceString;
      block.hashCode = new sha1().update(`${previousHash}${block.player}${block.team}${nonceString}${block.timestamp}`).digest("hex")
      ctx.postMessage(block);
      return;
    }
  }
};