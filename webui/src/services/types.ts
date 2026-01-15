export type Block = {
  index: number;
  player: string;
  team: string;
  timestamp: number;
  nonce: number;
  hash: string;
  previousHash: string;
  message?: string;
};

export type ChainState = {
  recent: Block[];
  difficulty: string;
};

export type PlayerScore = {
  player: string;
  score: number;
};

export type TeamScore = {
  team: string;
  score: number;
};

export type SubmitBlockRequest = {
  previousHash: string;
  player: string;
  nonce: number;
  hash: string;
  message?: string;
};

export type MiningInfo = {
  previousHash: string;
  previousTimestamp: number;
  difficulty: string;
};

// Miner service types
export type StartMiningParams = {
  team: string;
  player: string;
  previousHash: string;
  previousTimestamp: number;
  difficulty: string;
};

export type HashFoundMessage = {
  type: "HASH_FOUND";
  hash: string;
  nonce: number;
  team: string;
  player: string;
};

export type ProgressMessage = {
  type: "PROGRESS";
  hashesPerSecond: number;
};
