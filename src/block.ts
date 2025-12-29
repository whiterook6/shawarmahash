import crypto from "crypto";

export type Block = {
  index: number;
  player: string;
  team: string;
  timestamp: number;
  nonce: string;
  hash: string;
};

export type PendingBlock = {
  player: string;
  team: string;
  nonce: string;
}

export const calculateHash = (
  previousHash: string,
  previousTimestamp: number,
  player: string,
  team: string,
  nonce: string
) => {
  return crypto.createHash("sha256").update(
    `${previousHash}${previousTimestamp}${player}${team}${nonce}`
  ).digest("hex");
};