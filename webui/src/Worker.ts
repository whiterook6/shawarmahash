import { sha1 } from "sha.js";
import { BeginMiningMSG, HashRateMSG, NonceFoundMSG } from "./MessageTypes";
const ctx: Worker = self as any;

onmessage = (event: MessageEvent) => {
  const message = event.data;
  if (message.event === "begin-mining"){
    const previousHash: string = (message as BeginMiningMSG).previousHash;
    const target: string = (message as BeginMiningMSG).difficultyTarget;

    const startingNonce = Math.floor(Math.random() * 1000000);
    let nonce = startingNonce;

    const startingTime = Date.now();
    let nextHashRateUpdate = startingTime + 1000;

    while (true) {
      const nonceString = (nonce++).toString(16);
      const difficultyHash = new sha1()
        .update(`${previousHash}${nonceString}`)
        .digest("hex");

      const now = Date.now();
      if (now > nextHashRateUpdate) {
        nextHashRateUpdate = now + 1000;
        ctx.postMessage({
          event: "hash-rate",
          hashRate: Math.floor(1000 * (nonce - startingNonce) / (now - startingTime))
        } as HashRateMSG);
      }

      if (difficultyHash < target) {
        ctx.postMessage({
          event: "nonce-found",
          nonce: nonceString,
          previousHash,
          hashRate: Math.floor(1000 * (nonce - startingNonce) / (now - startingTime))
        } as NonceFoundMSG);
        return;
      }
    }
  }
};
