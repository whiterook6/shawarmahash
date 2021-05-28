import { Block } from "./Block"

export type BeginMiningMSG = {
  event: "begin-mining",
  previousHash: string;
  difficultyTarget: string;
}

export type NonceFoundMSG = {
  event: "nonce-found";
  previousHash: string;
  nonce: string;
  hashRate: number;
}

export type HashRateMSG = {
  event: "hash-rate";
  hashRate: number;
}

export type SetIDMSG = {
  event: "set-id";
  player: string;
  team?: string;
}

export type BlockFoundMSG = {
  event: "block-found",
  block: Block;
  difficultyTarget: string;
}
