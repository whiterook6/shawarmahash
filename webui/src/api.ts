import type {
  Block,
  ChainStateResponse,
  HealthResponse,
  MiningTarget,
  PlayerWithScoreResponse,
  TeamWithScoreResponse,
} from "./types";

export const Api = {
  getHealth: async (): Promise<HealthResponse> => {
    return Api.__get<HealthResponse>("/health");
  },

  getPlayers: async (): Promise<PlayerWithScoreResponse[]> => {
    return Api.__get<PlayerWithScoreResponse[]>("/players");
  },

  getPlayerScore: async (player: string): Promise<PlayerWithScoreResponse> => {
    return Api.__get<PlayerWithScoreResponse>(`/players/${player}/score`);
  },

  getPlayerMessages: async (player: string): Promise<Block[]> => {
    return Api.__get<Block[]>(`/players/${player}/messages`);
  },

  getTeams: async (): Promise<TeamWithScoreResponse[]> => {
    return Api.__get<TeamWithScoreResponse[]>("/teams");
  },

  getTeamScore: async (team: string): Promise<TeamWithScoreResponse> => {
    return Api.__get<TeamWithScoreResponse>(`/teams/${team}/score`);
  },

  getTeamMessages: async (team: string): Promise<Block[]> => {
    return Api.__get<Block[]>(`/teams/${team}/messages`);
  },

  getTeamPlayers: async (team: string): Promise<string[]> => {
    return Api.__get<string[]>(`/teams/${team}/players`);
  },

  getTeam: async (team: string): Promise<MiningTarget> => {
    return Api.__get<MiningTarget>(`/teams/${team}`);
  },

  submitBlock: async (
    team: string,
    block: Block,
  ): Promise<ChainStateResponse> => {
    return Api.__post<ChainStateResponse>(`/teams/${team}/chain`, block);
  },

  __get: async <T>(url: string): Promise<T> => {
    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get ${url}: ${error}`);
    }
    return response.json() as Promise<T>;
  },

  __post: async <T>(url: string, body: unknown): Promise<T> => {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to submit block: ${error}`);
    }
    return response.json() as Promise<T>;
  },
};
