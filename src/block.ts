import crypto from "crypto";

export type Block = {
  index: number;
  player: string;
  timestamp: number;
  nonce: string;
  hash: string;
};

export type PendingBlock = {
  player: string;
  nonce: string;
}

export const calculateHash = (
  previousHash: string,
  previousTimestamp: number,
  player: string,
  nonce: string
) => {
  return crypto.createHash("sha256").update(
    `${previousHash}${previousTimestamp}${player}${nonce}`
  ).digest("hex");
};