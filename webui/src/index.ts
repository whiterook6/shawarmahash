import {getBlocks, submitBlock} from "./Api";
import {sha1} from "sha.js";

let previousHash: string;
let nonce: number;
let shouldMine = true;

const toggleMining = () => {
  if (shouldMine === true){
    shouldMine = false;
  } else {
    startMining();
  }
}

const startMining = async (block?) => {
  if (block){
    previousHash = block.hashCode;
  } else {
    const blocks = await getBlocks();
    console.log(blocks);
    if (blocks.length > 0){
      previousHash = blocks[blocks.length - 1].hashCode;
    } else {
      previousHash = "0";
    }
  }

  shouldMine = true;
  nonce = Math.floor(Math.random() * 1000000);
  console.log("Begin mining");
  requestAnimationFrame(mine);
}

const mine = () => {
  if (!shouldMine){
    return;
  }

  const newBlock = {
    previousHash,
    nonce: "",
    hashCode: "",
    player: "TIM",
    team: "TUT",
    timestamp: Math.floor(Date.now() / 1000)
  };

  const limit = nonce + 1000;
  do {
    const nonceString = (nonce++).toString(16);
    const difficultyHash = new sha1().update(`${previousHash}${nonceString}`).digest("hex") as string;
    if (difficultyHash.startsWith("00000")){
      newBlock.nonce = nonceString;
      newBlock.hashCode = new sha1().update(`${newBlock.previousHash}${newBlock.player}${newBlock.team}${nonceString}${newBlock.timestamp}`).digest("hex")
      console.log("Block found");
      console.log(JSON.stringify(newBlock));
      submitBlock(newBlock);
      shouldMine = false;
    }
  } while (nonce < limit && shouldMine);
  if (shouldMine){
    requestAnimationFrame(mine);
  }
}

const socket = new WebSocket("ws://localhost:8080");
socket.onopen = () => {
  console.log("Connected");
  startMining();

  socket.onmessage = (event: MessageEvent) => {
    const message = JSON.parse(event.data);
    if (message.event){
      switch (message.event){
        case "block-found":
          console.log("someone else mined a block")
          const block = message.data.block;
          console.log(block);
          if (!shouldMine){
            startMining(block);
          }
      }
    }
  }
}