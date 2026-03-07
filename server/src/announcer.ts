import { Broadcast } from "./broadcast/broadcast";
import {
  ActivePlayersMessage,
  ScoresUpdateMessage,
} from "./broadcast/broadcast.types";
import { Game } from "./game/game";
import { Identity } from "./identity/identity";
import { PlayerScore, TeamScore } from "./score/score";

export class Announcer {
  private interval: NodeJS.Timeout | undefined = undefined;
  private broadcast: Broadcast | undefined = undefined;
  private game: Game | undefined = undefined;

  setBroadcast(broadcast: Broadcast): void {
    this.broadcast = broadcast;
  }

  setGame(game: Game): void {
    this.game = game;
  }

  start(): void {
    if (this.broadcast && this.game) {
      this.interval = setInterval(this.onInterval.bind(this), 1000);
    } else {
      throw new Error("Broadcast and game are required");
    }
  }

  stop(): void {
    clearInterval(this.interval);
  }

  onInterval(): void {
    if (!this.broadcast || !this.game) {
      return;
    } else if (this.broadcast.getSubscriberCount() === 0) {
      return;
    }

    const activeTeamNames = this.game.getTeamNames();
    const activeTeamScores: TeamScore[] = this.broadcast
      .getActiveTeams()
      .map((team: string) => {
        if (activeTeamNames.includes(team)) {
          const teamScore = this.game!.getTeamScore(team);
          return {
            team,
            score: teamScore,
          };
        } else {
          return {
            team,
            score: 0,
          };
        }
      });
    const activePlayerScores: PlayerScore[] = this.broadcast
      .getActivePlayers()
      .map((player: Identity) => {
        const playerScore = this.game!.getPlayerScore(player.identity);
        return {
          player: player.player,
          identity: player.identity,
          score: playerScore,
        };
      });
    const topPlayers = this.game.getTopPlayers();
    const topTeams = this.game.getTopTeams();

    const scoresMessage: ScoresUpdateMessage = {
      type: "scoresUpdate",
      payload: {
        activeTeamScores,
        activePlayerScores,
        topPlayers,
        topTeams,
      },
    };
    this.broadcast.cast(scoresMessage);

    const activePlayersPayload = this.broadcast.getActivePlayers().map((p) => ({
      player: p.player,
      team: p.team,
      identity: p.identity,
      score: this.game!.getPlayerScore(p.identity),
    }));
    const activePlayersMessage: ActivePlayersMessage = {
      type: "activePlayers",
      payload: activePlayersPayload,
    };
    this.broadcast.cast(activePlayersMessage);
  }
}
