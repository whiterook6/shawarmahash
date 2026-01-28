/// <reference lib="webworker" />
import type {
  MiningErrorResponse,
  MiningProgressResponse,
  MiningRequest,
  MiningStatusResponse,
  MiningSuccessResponse,
  MiningTarget,
  StartMiningRequest,
} from "./mining.types";

class Miner {
  private scope: DedicatedWorkerGlobalScope;
  private SubtleCrypto: SubtleCrypto;
  private currentMiningRequest: MiningRequest;
  private updateInterval: number | null;
  private isMiningLoopActive: boolean;
  private totalHashesSinceInstantiation: number;

  constructor(scope: DedicatedWorkerGlobalScope) {
    const SubtleCrypto = Miner.getCryptoSubtle(scope);
    if (!SubtleCrypto) {
      console.error("[Miner] Web Crypto API not available");
      throw new Error("Web Crypto API not available.");
    }

    this.scope = scope;
    this.SubtleCrypto = SubtleCrypto;
    this.currentMiningRequest = {
      type: "stop_mining",
    };
    this.updateInterval = null;
    this.isMiningLoopActive = false;
    this.totalHashesSinceInstantiation = 0;
  }

  clearUpdateInterval() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  stopMining() {
    this.currentMiningRequest = {
      type: "stop_mining",
    };
    this.clearUpdateInterval();
    // Note: isMiningLoopActive will be set to false when the loop exits
  }

  async startMining(request: StartMiningRequest) {
    // Stop any existing mining loop before starting a new one
    // This prevents race conditions where multiple loops could run concurrently
    if (this.isMiningLoopActive) {
      this.stopMining();
      // Wait a tick to allow the existing loop to exit cleanly
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    // Update the current mining request
    const target: MiningTarget = {
      ...request.data,
    };
    this.currentMiningRequest = {
      type: "start_mining",
      data: target,
    };

    // Mark that a mining loop is starting
    this.isMiningLoopActive = true;

    // stop the update interval if it's already running
    this.clearUpdateInterval();

    // prepare the mining variables, start time, etc.
    let nonce = Math.floor(Math.random() * 1000000);
    let bestHash = "";
    let hashesChecked = 0;
    const startTime = Date.now();
    const PROGRESS_UPDATE_INTERVAL = 1000 / 30; // 30 times per second

    // on an interval, update the main thread with progress towards the target hash
    this.updateInterval = setInterval(() => {
      // stop the interval if we are done mining
      if (this.currentMiningRequest.type === "stop_mining") {
        this.clearUpdateInterval();
        return;
      }

      // calculate the elapsed time and hashes per second
      const elapsed = (Date.now() - startTime) / 1000;
      const hashesPerSecond = Math.ceil(hashesChecked / elapsed);

      // send the progress to the main thread
      this.sendProgress({
        nonce: nonce,
        bestHash: bestHash,
        hashesPerSecond: hashesPerSecond,
        totalHashes: this.totalHashesSinceInstantiation,
      });
    }, PROGRESS_UPDATE_INTERVAL) as unknown as number;

    try {
      const encoder = new TextEncoder();
      while (this.isMining() && this.isMiningLoopActive) {
        // Check if target changed before doing expensive hash operation
        const current = this.currentMiningRequest;
        if (
          current.type !== "start_mining" ||
          current.data.previousHash !== target.previousHash ||
          current.data.previousTimestamp !== target.previousTimestamp ||
          current.data.player !== target.player ||
          current.data.team !== target.team ||
          current.data.difficulty !== target.difficulty
        ) {
          // Target changed or mining was stopped, exit the loop
          return;
        }

        let hash: ArrayBuffer;
        try {
          hash = await this.hash(current.data, nonce, encoder);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          const errorName = error instanceof Error ? error.name : "Unknown";
          const message = `Crypto operation failed (${errorName}): ${errorMessage}. Make sure you're using HTTPS or localhost, and your browser supports Web Crypto API in workers.`;
          this.sendError(message);
          this.stopMining();
          this.sendStatus("inactive");
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
        this.totalHashesSinceInstantiation++;

        // Check if we found a valid hash
        if (hashString >= current.data.difficulty) {
          // Double-check that we're still mining the same target before sending success
          // This prevents sending success for a target that was superseded
          if (
            this.isMiningLoopActive &&
            this.currentMiningRequest.type === "start_mining" &&
            this.currentMiningRequest.data.previousHash ===
              target.previousHash &&
            this.currentMiningRequest.data.previousTimestamp ===
              target.previousTimestamp &&
            this.currentMiningRequest.data.player === target.player &&
            this.currentMiningRequest.data.team === target.team &&
            this.currentMiningRequest.data.difficulty === target.difficulty
          ) {
            this.sendSuccess({
              previousHash: target.previousHash,
              previousTimestamp: target.previousTimestamp,
              player: target.player,
              team: target.team,
              nonce: nonce,
              hash: hashString,
            });
          }
          return;
        }
        nonce++;
      }
    } catch (error) {
      this.stopMining();
      this.sendError(`Crypto operation failed: ${error}`);
      return;
    } finally {
      this.isMiningLoopActive = false;
      this.sendStatus("inactive");
      this.clearUpdateInterval();
    }
  }

  getMiningStatus() {
    const status = this.isMining() ? "active" : "inactive";
    const message: MiningStatusResponse = {
      type: "mining_status",
      data: {
        status,
      },
    };
    this.scope.postMessage(message);
  }

  private async hash(
    target: MiningTarget,
    nonce: number,
    textEncoder: TextEncoder,
  ): Promise<ArrayBuffer> {
    const data = textEncoder.encode(
      `${target.previousHash}${target.previousTimestamp}${target.player}${target.team}${nonce}`,
    );
    // Ensure data is a Uint8Array (TextEncoder.encode returns this, but double-check)
    const dataArray = data instanceof Uint8Array ? data : new Uint8Array(data);

    return this.SubtleCrypto!.digest({ name: "SHA-256" }, dataArray);
  }

  private isMining() {
    return this.currentMiningRequest.type === "start_mining";
  }

  private sendProgress(progress: {
    nonce: number;
    bestHash: string;
    hashesPerSecond: number;
    totalHashes: number;
  }) {
    const message: MiningProgressResponse = {
      type: "mining_progress",
      data: {
        nonce: progress.nonce,
        bestHash: progress.bestHash,
        hashesPerSecond: progress.hashesPerSecond,
        totalHashes: progress.totalHashes,
      },
    };
    this.scope.postMessage(message);
  }

  private sendSuccess(success: {
    previousHash: string;
    previousTimestamp: number;
    player: string;
    team: string;
    nonce: number;
    hash: string;
  }) {
    const message: MiningSuccessResponse = {
      type: "mining_success",
      data: {
        previousHash: success.previousHash,
        previousTimestamp: success.previousTimestamp,
        player: success.player,
        team: success.team,
        nonce: success.nonce,
        hash: success.hash,
      },
    };
    this.scope.postMessage(message);
  }

  private sendError(error: string) {
    const message: MiningErrorResponse = {
      type: "mining_error",
      data: {
        message: error,
      },
    };
    this.scope.postMessage(message);
  }

  private sendStatus(status: "active" | "inactive") {
    const message: MiningStatusResponse = {
      type: "mining_status",
      data: {
        status: status,
      },
    };
    this.scope.postMessage(message);
  }

  static getCryptoSubtle(
    scope: DedicatedWorkerGlobalScope,
  ): SubtleCrypto | null {
    try {
      // Try to access crypto API
      if (scope.crypto && scope.crypto.subtle) {
        return scope.crypto.subtle;
      }
    } catch (e) {
      console.error("[Miner] Error getting crypto.subtle:", e);
    }
    return null;
  }
}

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
