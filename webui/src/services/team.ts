import { BaseService } from "./base";
import {
  type Block,
  type ChainState,
  type MiningInfo,
  type SubmitBlockRequest,
  type TeamScore,
} from "./types";

export class TeamService extends BaseService {
  async getTeams(): Promise<TeamScore[]> {
    const response = await fetch("/teams");
    return this.handleResponse<TeamScore[]>(response);
  }

  async getTeamScore(team: string): Promise<TeamScore> {
    const response = await fetch(`/teams/${encodeURIComponent(team)}/score`);
    return this.handleResponse<TeamScore>(response);
  }

  async getTeamMessages(team: string): Promise<Block[]> {
    const response = await fetch(`/teams/${encodeURIComponent(team)}/messages`);
    return this.handleResponse<Block[]>(response);
  }

  async getTeamPlayers(team: string): Promise<string[]> {
    const response = await fetch(`/teams/${encodeURIComponent(team)}/players`);
    return this.handleResponse<string[]>(response);
  }

  async getMiningInfo(team: string): Promise<MiningInfo> {
    const response = await fetch(`/teams/${encodeURIComponent(team)}`);
    return this.handleResponse<MiningInfo>(response);
  }

  async submitBlock(
    team: string,
    payload: SubmitBlockRequest,
  ): Promise<ChainState> {
    const response = await fetch(`/teams/${encodeURIComponent(team)}/chain`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return this.handleResponse<ChainState>(response);
  }
}
