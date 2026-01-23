/// <reference lib="webworker" />

import type { MiningRequest, StartMiningRequest } from "../../types";
import { Miner } from "./Miner";

// Ensure crypto is available in worker context
declare const self: DedicatedWorkerGlobalScope;

const miner = new Miner(self);
self.addEventListener("message", async (event: MessageEvent<MiningRequest>) => {
  const request = event.data;
  switch (request.type) {
    case "start_mining":
      return miner.startMining(request as StartMiningRequest);
    case "stop_mining":
      return miner.stopMining();
    case "mining_status":
      return miner.getMiningStatus();
    default: {
      const unknownType = (request as { type: string }).type;
      self.postMessage({
        type: "error",
        data: { message: `Unknown message type: ${unknownType}` },
      });
    }
  }
});
