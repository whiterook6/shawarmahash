import type {
  ChainStateAPIResponse,
  ChatMessageAPIResponse,
  HealthAPIResponse,
  IdentityAPIResponse,
  PlayerScoreByIdentityAPIResponse,
  PlayerWithScoreAPIResponse,
  SubmitBlockAPIRequest,
  TeamMiningTargetAPIResponse,
  TeamWithScoreAPIResponse,
} from "./api.types";

const RATE_LIMIT_STATUS = 429;
const DEFAULT_RETRY_AFTER_MS = 1000;

/**
 * Runs the request; if the response is 429 (rate limit), waits per Retry-After
 * (or default) and retries once. Other errors are not retried.
 */
async function withRateLimitRetry(
  doRequest: () => Promise<Response>,
): Promise<Response> {
  const response = await doRequest();
  if (response.status !== RATE_LIMIT_STATUS) {
    return response;
  }

  // parse the Retry-After header
  const retryAfter = response.headers.get("Retry-After");
  let delayMS = DEFAULT_RETRY_AFTER_MS;
  if (retryAfter !== null) {
    // First, try numeric seconds form
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0) {
      delayMS = seconds * 1000;
    } else {
      // Fallback: try HTTP-date form
      const dateMs = Date.parse(retryAfter);
      if (!Number.isNaN(dateMs)) {
        delayMS = Math.max(0, dateMs - Date.now());
      }
    }
  }

  if (delayMS > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMS));
  }
  return doRequest();
}

export const Api = {
  getHealth: async (): Promise<HealthAPIResponse> => {
    return Api.__get<HealthAPIResponse>("/api/health");
  },

  postIdentity: async (): Promise<IdentityAPIResponse> => {
    return Api.__post<IdentityAPIResponse>("/api/identity");
  },

  getPlayers: async (): Promise<PlayerWithScoreAPIResponse[]> => {
    return Api.__get<PlayerWithScoreAPIResponse[]>("/api/players");
  },

  getTopPlayers: async (): Promise<PlayerWithScoreAPIResponse[]> => {
    return Api.__get<PlayerWithScoreAPIResponse[]>("/api/players/top");
  },

  getMyScore: async (): Promise<PlayerScoreByIdentityAPIResponse> => {
    return Api.__get<PlayerScoreByIdentityAPIResponse>("/api/players/me/score");
  },

  getPlayerScore: async (
    identity: string,
  ): Promise<PlayerScoreByIdentityAPIResponse> => {
    return Api.__get<PlayerScoreByIdentityAPIResponse>(
      `/api/players/${identity}/score`,
    );
  },

  getTeams: async (): Promise<TeamWithScoreAPIResponse[]> => {
    return Api.__get<TeamWithScoreAPIResponse[]>("/api/teams");
  },

  getTopTeams: async (): Promise<TeamWithScoreAPIResponse[]> => {
    return Api.__get<TeamWithScoreAPIResponse[]>("/api/teams/top");
  },

  getTeamScore: async (team: string): Promise<TeamWithScoreAPIResponse> => {
    return Api.__get<TeamWithScoreAPIResponse>(`/api/teams/${team}/score`);
  },

  getTeamPlayers: async (team: string): Promise<string[]> => {
    return Api.__get<string[]>(`/api/teams/${team}/players`);
  },

  getPublicChatMessages: async (): Promise<ChatMessageAPIResponse[]> => {
    return Api.__get<ChatMessageAPIResponse[]>("/api/chat/public");
  },

  getTeamChatMessages: async (
    team: string,
  ): Promise<ChatMessageAPIResponse[]> => {
    return Api.__get<ChatMessageAPIResponse[]>(`/api/chat/teams/${team}`);
  },

  getPlayerChatMessages: async (
    player: string,
  ): Promise<ChatMessageAPIResponse[]> => {
    return Api.__get<ChatMessageAPIResponse[]>(`/api/chat/players/${player}`);
  },

  getTeam: async (team: string): Promise<TeamMiningTargetAPIResponse> => {
    return Api.__get<TeamMiningTargetAPIResponse>(`/api/teams/${team}`);
  },

  submitBlock: async (
    team: string,
    block: SubmitBlockAPIRequest,
  ): Promise<ChainStateAPIResponse> => {
    return Api.__post<ChainStateAPIResponse>(`/api/teams/${team}/chain`, block);
  },

  __get: async <T>(url: string): Promise<T> => {
    const response = await withRateLimitRetry(() =>
      fetch(url, { credentials: "include" }),
    );
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

    const response = await withRateLimitRetry(() =>
      fetch(url, {
        method: "POST",
        credentials: "include",
        headers,
        body: requestBody,
      }),
    );

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
