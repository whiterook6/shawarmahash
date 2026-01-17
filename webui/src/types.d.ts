export type HealthResponse = {
  gitHash: string;
  startTime: string;
  now: string;
  uptime: number;
  activeChains: number;
  totalBlocks: number;
};

export type PlayerWithScoreResponse = {
  player: string;
  score: number;
};

export type TeamWithScoreResponse = {
  team: string;
  score: number;
};

export type MiningTarget = {
  previousHash: string;
  previousTimestamp: number;
  difficulty: string;
};

export type ChainStateResponse = {
  recent: Block[];
  difficulty: string;
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

export type StartMiningRequest = {
  type: "start_mining";
  data: {
    previousHash: string;
    previousTimestamp: number;
    player: string;
    team: string;
    difficulty: string;
  };
};

export type StopMiningRequest = {
  type: "stop_mining";
  data?: undefined;
};

export type MiningStatusRequest = {
  type: "mining_status";
  data?: undefined;
};

export type MiningRequest =
  | StartMiningRequest
  | StopMiningRequest
  | MiningStatusRequest;

export type MiningProgressResponse = {
  type: "mining_progress";
  data: {
    nonce: number;
    bestHash: string;
    hashesPerSecond: number;
  };
};

export type MiningSuccessResponse = {
  type: "mining_success";
  data: {
    player: string;
    team: string;
    nonce: number;
    hash: string;
  };
};

export type MiningErrorResponse = {
  type: "mining_error";
  data: {
    message: string;
  };
};

export type MiningStatusResponse = {
  type: "mining_status";
  data: {
    status: "active" | "inactive";
  };
};

export type MiningResponse =
  | MiningProgressResponse
  | MiningSuccessResponse
  | MiningErrorResponse
  | MiningStatusResponse;
