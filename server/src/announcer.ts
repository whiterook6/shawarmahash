import { Broadcast } from "./broadcast/broadcast";
import { Game } from "./game/game";
import { Identity } from "./identity/identity";
import { PlayerScore, TeamScore } from "./score/score";

export class Announcer {
  private interval: NodeJS.Timeout;
  constructor(
    private readonly broadcast: Broadcast,
    private readonly game: Game,
  ) {
    this.interval = setInterval(this.onInterval.bind(this), 1000);
  }

  stop(): void {
    clearInterval(this.interval);
  }

  onInterval(): void {
    const activeTeamScores: TeamScore[] = this.broadcast
      .getActiveTeams()
      .map((team: string) => {
        const teamScore = this.game.getTeamScore(team);
        return {
          team,
          score: teamScore,
        };
      });
    const activePlayerScores: PlayerScore[] = this.broadcast
      .getActivePlayers()
      .map((player: Identity) => {
        const playerScore = this.game.getPlayerScore(player.identity);
        return {
          player: player.player,
          identity: player.identity,
          score: playerScore,
        };
      });
    const topPlayers = this.game.getTopPlayers();
    const topTeams = this.game.getTopTeams();

    this.broadcast.cast({
      type: "scores-update",
      payload: {
        activeTeamScores,
        activePlayerScores,
        topPlayers,
        topTeams,
      },
    });
  }
}
