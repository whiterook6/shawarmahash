import { BaseService } from "./base";
import { type Block, type PlayerScore } from "./types";

export class PlayerService extends BaseService {
  async getPlayers(): Promise<PlayerScore[]> {
    const response = await fetch("/players");
    return this.handleResponse<PlayerScore[]>(response);
  }

  async getPlayerScore(player: string): Promise<PlayerScore> {
    const response = await fetch(
      `/players/${encodeURIComponent(player)}/score`,
    );
    return this.handleResponse<PlayerScore>(response);
  }

  async getPlayerMessages(player: string): Promise<Block[]> {
    const response = await fetch(
      `/players/${encodeURIComponent(player)}/messages`,
    );
    return this.handleResponse<Block[]>(response);
  }
}
