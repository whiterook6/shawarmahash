import type {
  ChainStateAPIResponse,
  HealthAPIResponse,
  IdentityAPIResponse,
  TeamMiningTarget as TeamMiningTargetAPIResponse,
  PlayerScoreByIdentityAPIResponse,
  PlayerWithScoreAPIResponse,
  SubmitBlockAPIRequest,
  TeamWithScoreAPIResponse,
} from "./types";

export const Api = {
  getHealth: async (): Promise<HealthAPIResponse> => {
    return Api.__get<HealthAPIResponse>("/health");
  },

  postIdentity: async (): Promise<IdentityAPIResponse> => {
    return Api.__post<IdentityAPIResponse>("/identity");
  },

  getPlayers: async (): Promise<PlayerWithScoreAPIResponse[]> => {
    return Api.__get<PlayerWithScoreAPIResponse[]>("/players");
  },

  getTopPlayers: async (): Promise<PlayerWithScoreAPIResponse[]> => {
    return Api.__get<PlayerWithScoreAPIResponse[]>("/players/top");
  },

  getMyScore: async (): Promise<PlayerScoreByIdentityAPIResponse> => {
    return Api.__get<PlayerScoreByIdentityAPIResponse>("/players/me/score");
  },

  getPlayerScore: async (
    identity: string,
  ): Promise<PlayerScoreByIdentityAPIResponse> => {
    return Api.__get<PlayerScoreByIdentityAPIResponse>(
      `/players/${identity}/score`,
    );
  },

  getTeams: async (): Promise<TeamWithScoreAPIResponse[]> => {
    return Api.__get<TeamWithScoreAPIResponse[]>("/teams");
  },

  getTopTeams: async (): Promise<TeamWithScoreAPIResponse[]> => {
    return Api.__get<TeamWithScoreAPIResponse[]>("/teams/top");
  },

  getTeamScore: async (team: string): Promise<TeamWithScoreAPIResponse> => {
    return Api.__get<TeamWithScoreAPIResponse>(`/teams/${team}/score`);
  },

  getTeamPlayers: async (team: string): Promise<string[]> => {
    return Api.__get<string[]>(`/teams/${team}/players`);
  },

  getTeam: async (team: string): Promise<TeamMiningTargetAPIResponse> => {
    return Api.__get<TeamMiningTargetAPIResponse>(`/teams/${team}`);
  },

  submitBlock: async (
    team: string,
    block: SubmitBlockAPIRequest,
  ): Promise<ChainStateAPIResponse> => {
    return Api.__post<ChainStateAPIResponse>(`/teams/${team}/chain`, block);
  },

  __get: async <T>(url: string): Promise<T> => {
    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) {
      const error = await Api.__readError(response);
      throw new Error(`Failed to get ${url}: ${error}`);
    }
    return response.json() as Promise<T>;
  },

  __post: async <T>(url: string, body?: unknown): Promise<T> => {
    const headers: Record<string, string> = {};
    const requestBody = body === undefined ? undefined : JSON.stringify(body);
    if (requestBody !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers,
      body: requestBody,
    });

    if (!response.ok) {
      const error = await Api.__readError(response);
      throw new Error(`Failed to post ${url}: ${error}`);
    }
    return response.json() as Promise<T>;
  },

  __readError: async (response: Response): Promise<string> => {
    try {
      const error = await response.json();
      if (error.error) {
        return error.error;
      } else if (error.message) {
        return error.message;
      } else if (error.validationErrors) {
        return JSON.stringify(error.validationErrors);
      } else if (error.statusCode) {
        return `HTTP ${error.statusCode}`;
      } else {
        return JSON.stringify(error);
      }
    } catch {
      return `HTTP ${response.status}`;
    }
  },
};
