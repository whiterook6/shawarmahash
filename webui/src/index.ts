import {submitBlock} from "./Api";
import {sha1} from "sha.js";

let previousHash: string;
let nonce: number;
let shouldMine = true;
const startMining = (topBlock) => {
  shouldMine = true;
  previousHash = topBlock.hashCode;
  nonce = Math.floor(Math.random() * 1000000);
  requestAnimationFrame(mine);
}

const mine = () => {
  const newBlock = {
    previousHash,
    nonce: "",
    hashCode: "",
    player: "TIM",
    team: "TUT",
    timestamp: Math.floor(Date.now() / 1000)
  };

  const limit = nonce + 2000;
  let hashCode;
  do {

    const nonceString = (nonce++).toString(16);
    const difficultyHash = new sha1().update(`${previousHash}${nonceString}`).digest("hex") as string;
    if (difficultyHash.startsWith("0000")){
      newBlock.nonce = nonceString;
      newBlock.hashCode = new sha1().update(`${previousHash}${nonceString}${newBlock.player}${newBlock.team}${newBlock.timestamp.toString(10)}`).digest("hex")
      submitBlock(newBlock);
    }
  } while (nonce < limit && shouldMine);
  requestAnimationFrame(mine);
}