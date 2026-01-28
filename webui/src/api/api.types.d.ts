import type { TeamMiningTarget } from "../mining/mining.types";

export type HealthAPIResponse = {
  gitHash: string;
  startTime: string;
  now: string;
  uptime: number;
  activeChains: number;
  totalBlocks: number;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  dataDirectory: {
    exists: boolean;
    readable: boolean;
    writable: boolean;
  };
  sseClients: number;
};

export type PlayerWithScoreAPIResponse = {
  player: string;
  identity: string;
  score: number;
};

export type PlayerScoreByIdentityAPIResponse = {
  identity: string;
  score: number;
  you?: true;
};

export type TeamWithScoreAPIResponse = {
  team: string;
  score: number;
};

export type TeamMiningTargetAPIResponse = TeamMiningTarget;

export type ChainStateAPIResponse = {
  team: string;
  recent: Block[];
  difficulty: string;
};

export type IdentityAPIResponse = {
  identityToken: string;
};

export type SubmitBlockAPIRequest = {
  previousHash: string;
  player: string;
  identity: string;
  nonce: number;
  hash: string;
  message?: string;
};

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
