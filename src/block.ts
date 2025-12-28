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