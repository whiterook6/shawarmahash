import crypto from "crypto";

export type Block = {
  index: number;
  player: string;
  team: string;
  timestamp: number;
  nonce: number;
  hash: string;
  message?: string;
};

export type PendingBlock = {
  player: string;
  team: string;
  nonce: number;
}

export const calculateHash = (
  previousHash: string,
  previousTimestamp: number,
  player: string,
  team: string,
  nonce: number
) => {
  return crypto.createHash("sha256").update(
    `${previousHash}${previousTimestamp}${player}${team}${nonce}`
  ).digest("hex");
};