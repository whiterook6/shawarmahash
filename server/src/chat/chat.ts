import { Block } from "../block/block";
import { Broadcast, TO_PLAYER, TO_TEAM } from "../broadcast/broadcast";

const PLAYER_REGEX = /^@([A-Z]{3})\b/;
const TEAM_REGEX = /^#([A-Z]{3})\b/;
export class Chat {
  private broadcast: Broadcast | undefined = undefined;

  setBroadcast(broadcast: Broadcast): void {
    this.broadcast = broadcast;
  }

  handleChatMessage(message: string, block: Block): void {
    if (!this.broadcast) {
      return;
    }

    const isTeamMessage = message.match(TEAM_REGEX);
    if (isTeamMessage && isTeamMessage.length > 1 && message.length > 4) {
      const team = isTeamMessage[1]; // e.g. "TST" or "ABC"
      return this.broadcast.cast(
        {
          type: "chat_message_received",
          payload: {
            player: block.player,
            team: block.team,
            identity: block.identity,
            message,
          },
        },
        TO_TEAM(team),
      );
    }

    const isPlayerMessage = message.match(PLAYER_REGEX);
    if (isPlayerMessage && isPlayerMessage.length > 1 && message.length > 4) {
      const player = isPlayerMessage[1]; // e.g. "TST" or "ABC"
      return this.broadcast.cast(
        {
          type: "chat_message_received",
          payload: {
            player: block.player,
            team: block.team,
            identity: block.identity,
            message,
          },
        },
        TO_PLAYER(player),
      );
    }

    return this.broadcast.cast({
      type: "chat_message_received",
      payload: {
        player: block.player,
        team: block.team,
        identity: block.identity,
        message,
      },
    });
  }
}
