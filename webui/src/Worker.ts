import { sha1 } from "sha.js";
import { Block } from "./Block";
const ctx: Worker = self as any;

onmessage = (message) => {
  switch (message.data.type) {
    case "begin-mining":
      const block: Block = message.data.block;
      const target: string = message.data.target;
      const previousHash = block.previousHash;

      let nonce = Math.floor(Math.random() * 1000000);
      let difficultyHash;
      console.log(
        `Miner starting with ${previousHash} - ${nonce.toString(16)}`
      );
      while (true) {
        const nonceString = (nonce++).toString(16);
        difficultyHash = new sha1()
          .update(`${previousHash}${nonceString}`)
          .digest("hex");

        if (difficultyHash.startsWith(target)) {
          block.nonce = nonceString;
          block.hashCode = new sha1()
            .update(
              `${previousHash}${block.player}${block.team}${nonceString}${block.timestamp}`
            )
            .digest("hex");
          ctx.postMessage({
            type: "block-found",
            block,
          });
          return;
        }
      }
  }
};
