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

export type CreateTeamRequest = {
  player: string;
  hash: string;
  nonce: number;
};

export type SubmitBlockRequest = {
  previousHash: string;
  player: string;
  nonce: number;
  hash: string;
  message?: string;
};

export type TestMintRequest = {
  player: string;
  team: string;
  message?: string;
};

export type HealthMemoryUsage = {
  rss: number;
  heapTotal: number;
  heapUsed: number;
  external: number;
};

export type HealthDataDirectory = {
  exists: boolean;
  readable: boolean;
  writable: boolean;
};

export type HealthStatus = {
  gitHash: string;
  startTime: Date;
  now: Date;
  uptime: number;
  activeChains: number;
  totalBlocks: number;
  memoryUsage: HealthMemoryUsage;
  dataDirectory: HealthDataDirectory;
  sseClients: number;
};

export type HealthStatusRaw = {
  gitHash: string;
  startTime: string;
  now: string;
  uptime: number;
  activeChains: number;
  totalBlocks: number;
  memoryUsage: HealthMemoryUsage;
  dataDirectory: HealthDataDirectory;
  sseClients: number;
};
