export type TeamMiningTarget = {
  team: string;
  previousHash: string;
  previousTimestamp: number;
  difficulty: string;
};

export type MiningTarget = {
  previousHash: string;
  previousTimestamp: number;
  player: string;
  team: string;
  difficulty: string;
};

export type StartMiningRequest = {
  type: "start_mining";
  data: MiningTarget;
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
    totalHashes: number;
  };
};

export type MiningSuccessResponse = {
  type: "mining_success";
  data: {
    previousHash: string;
    previousTimestamp: number;
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
