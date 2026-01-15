import { BaseService } from "./base";
import type {
  HashFoundMessage,
  ProgressMessage,
  StartMiningParams,
} from "./types";

export class MinerService extends BaseService {
  private worker: Worker | null = null;
  private hashFoundCallbacks: Set<(message: HashFoundMessage) => void> =
    new Set();
  private progressCallbacks: Set<(message: ProgressMessage) => void> =
    new Set();

  constructor() {
    super();
    this.initWorker();
  }

  private initWorker(): void {
    if (this.worker) {
      return;
    }

    this.worker = new Worker(
      new URL("../workers/miner.worker.ts", import.meta.url),
      { type: "module" },
    );

    this.worker.addEventListener("message", (event: MessageEvent) => {
      const message = event.data;

      switch (message.type) {
        case "HASH_FOUND":
          this.hashFoundCallbacks.forEach((callback) => {
            try {
              callback(message as HashFoundMessage);
            } catch (error) {
              console.error("Error in hash found callback:", error);
            }
          });
          break;
        case "PROGRESS":
          this.progressCallbacks.forEach((callback) => {
            try {
              callback(message as ProgressMessage);
            } catch (error) {
              console.error("Error in progress callback:", error);
            }
          });
          break;
        default:
          console.warn("Unknown message type from worker:", message);
      }
    });

    this.worker.addEventListener("error", (error) => {
      console.error("Worker error:", error);
    });
  }

  startMining(params: StartMiningParams): void {
    if (!this.worker) {
      this.initWorker();
    }

    const message = {
      type: "START_MINING" as const,
      team: params.team,
      player: params.player,
      previousHash: params.previousHash,
      previousTimestamp: params.previousTimestamp,
      difficulty: params.difficulty,
    };

    this.worker?.postMessage(message);
  }

  stopMining(): void {
    if (!this.worker) {
      return;
    }

    const message = {
      type: "STOP_MINING" as const,
    };

    this.worker.postMessage(message);
  }

  onHashFound(callback: (message: HashFoundMessage) => void): () => void {
    this.hashFoundCallbacks.add(callback);
    return () => {
      this.hashFoundCallbacks.delete(callback);
    };
  }

  onProgress(callback: (message: ProgressMessage) => void): () => void {
    this.progressCallbacks.add(callback);
    return () => {
      this.progressCallbacks.delete(callback);
    };
  }

  cleanup(): void {
    this.stopMining();
    this.hashFoundCallbacks.clear();
    this.progressCallbacks.clear();

    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}
