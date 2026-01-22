/// <reference lib="webworker" />

import type {
  MiningErrorResponse,
  MiningProgressResponse,
  MiningRequest,
  MiningStatusResponse,
  MiningSuccessResponse,
  StartMiningRequest,
} from "../../types";

// Ensure crypto is available in worker context
declare const self: DedicatedWorkerGlobalScope;

/**
 * Gets the Web Crypto API's SubtleCrypto interface from the worker context.
 * Returns null if not available and sends an error message to the main thread.
 */
const getCryptoSubtle = (): SubtleCrypto | undefined => {
  try {
    // Try to access crypto API
    if (self.crypto && self.crypto.subtle) {
      return self.crypto.subtle;
    }
  } catch (e) {
    console.error("[Miner] Error getting crypto.subtle:", e);
  }
};

const Miner = {
  currentMiningRequest: {
    type: "stop_mining",
  } as MiningRequest,

  stopMining: () => {
    Miner.currentMiningRequest = {
      type: "stop_mining",
    };
  },

  startMining: async (request: StartMiningRequest) => {
    // Get crypto.subtle from worker context
    const cryptoSubtle = getCryptoSubtle();
    if (!cryptoSubtle) {
      self.postMessage({
        type: "mining_error",
        data: {
          message: "Web Crypto API not available.",
        },
      } as MiningErrorResponse);
      return;
    }

    Miner.currentMiningRequest = {
      type: "start_mining",
      data: {
        ...request.data,
      },
    };

    // keep a local copy to check if the target has changed
    const target = {
      ...request.data,
    };

    let nonce = Math.floor(Math.random() * 1000000);
    let bestHash = "";
    let hashesChecked = 0;
    const startTime = Date.now();
    const PROGRESS_UPDATE_INTERVAL = 1000 / 30; // 30 times per second

    const interval = setInterval(() => {
      if (Miner.currentMiningRequest.type === "stop_mining") {
        clearInterval(interval);
        return;
      }

      const elapsed = (Date.now() - startTime) / 1000;
      const hashesPerSecond = Math.ceil(hashesChecked / elapsed);
      const message: MiningProgressResponse = {
        type: "mining_progress",
        data: {
          nonce: nonce,
          bestHash: bestHash,
          hashesPerSecond: hashesPerSecond,
        },
      };
      self.postMessage(message);
    }, PROGRESS_UPDATE_INTERVAL);

    try {
      const encoder = new TextEncoder();
      while (Miner.currentMiningRequest.type === "start_mining") {
        // Check if target changed (safely)
        const current = Miner.currentMiningRequest;

        if (
          current.type !== "start_mining" ||
          target.previousHash !== current.data.previousHash ||
          target.previousTimestamp !== current.data.previousTimestamp ||
          target.player !== current.data.player ||
          target.team !== current.data.team
        ) {
          // Target changed, stop mining
          return;
        }

        const data = encoder.encode(
          `${target.previousHash}${target.previousTimestamp}${target.player}${target.team}${nonce}`,
        );

        let hash: ArrayBuffer;
        try {
          // Ensure data is a Uint8Array (TextEncoder.encode returns this, but double-check)
          const dataArray =
            data instanceof Uint8Array ? data : new Uint8Array(data);
          hash = await cryptoSubtle.digest({ name: "SHA-256" }, dataArray);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          const errorName = error instanceof Error ? error.name : "Unknown";
          const message: MiningErrorResponse = {
            type: "mining_error",
            data: {
              message: `Crypto operation failed (${errorName}): ${errorMessage}. Make sure you're using HTTPS or localhost, and your browser supports Web Crypto API in workers.`,
            },
          };
          self.postMessage(message);
          return;
        }

        const hashString = Array.from(new Uint8Array(hash))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
          .substring(0, 32); // Truncate to 32 characters to match server

        // Update best hash
        if (!bestHash || hashString > bestHash) {
          bestHash = hashString;
        }

        hashesChecked++;

        if (hashString >= target.difficulty) {
          const message: MiningSuccessResponse = {
            type: "mining_success",
            data: {
              previousHash: target.previousHash,
              previousTimestamp: target.previousTimestamp,
              player: target.player,
              team: target.team,
              nonce: nonce,
              hash: hashString,
            },
          };
          self.postMessage(message);
          return;
        }
        nonce++;
      }
    } finally {
      clearInterval(interval);
    }
  },

  getMiningStatus: () => {
    const message: MiningStatusResponse = {
      type: "mining_status",
      data: {
        status:
          Miner.currentMiningRequest.type === "start_mining"
            ? "active"
            : "inactive",
      },
    };
    self.postMessage(message);
  },
};

self.addEventListener("message", async (event: MessageEvent<MiningRequest>) => {
  const request = event.data;
  switch (request.type) {
    case "start_mining":
      return Miner.startMining(request as StartMiningRequest);
    case "stop_mining":
      return Miner.stopMining();
    case "mining_status":
      return Miner.getMiningStatus();
    default: {
      const unknownType = (request as { type: string }).type;
      self.postMessage({
        type: "error",
        data: { message: `Unknown message type: ${unknownType}` },
      });
    }
  }
});
