import { sha1 } from "sha.js";
const ctx: Worker = self as any;

onmessage = (message) => {
  switch (message.data.type) {
    case "begin-mining":
      const previousHash: string = message.data.previousHash;
      const target: string = message.data.target;

      let nonce = Math.floor(Math.random() * 1000000);

      while (true) {
        const nonceString = (nonce++).toString(16);
        const difficultyHash = new sha1()
          .update(`${previousHash}${nonceString}`)
          .digest("hex");

        if (difficultyHash.startsWith(target)) {
          ctx.postMessage({
            type: "nonce-found",
            nonce: nonceString,
            previousHash
          });
          return;
        }
      }
  }
};
