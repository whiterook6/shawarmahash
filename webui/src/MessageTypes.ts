import { Block } from "./Block"

/**
 * Send to web worker to begin mining. Like a constructor.
 */
export type BeginMiningMSG = {
  event: "begin-mining",
  previousHash: string;
  difficultyTarget: string;
}

/**
 * Received from web worker
 */
export type NonceFoundMSG = {
  event: "nonce-found";
  previousHash: string;
  nonce: string;
  hashRate: number;
}

/**
 * Received from web worker
 */
export type HashRateMSG = {
  event: "hash-rate";
  hashRate: number;
}

/**
 * Comes from the server, via Server Events.
 */
export type BlockFoundMSG = {
  block: Block;
  difficultyTarget: string;
}
