import { Block } from "../block/block";
import { Broadcast, TO_PLAYER, TO_TEAM } from "../broadcast/broadcast";
import { Chain } from "../chain/chain";
import { ChatMessage } from "./chat.types";

const PLAYER_REGEX = /^@([A-Z]{3})\b/;
const TEAM_REGEX = /^#([A-Z]{3})\b/;

export class Chat {
  private broadcast: Broadcast | undefined = undefined;
  private chains: Map<string, Chain> | undefined = undefined;

  setChains(chains: Map<string, Chain>): void {
    this.chains = chains;
  }

  setBroadcast(broadcast: Broadcast): void {
    this.broadcast = broadcast;
  }

  getTeamChatMessages(team: string): ChatMessage[] {
    if (!this.chains) {
      return [];
    }

    return Array.from(this.chains.values())
      .flat()
      .filter((block) => {
        if (
          !block.data ||
          block.data!.type !== "chat_message" ||
          typeof block.data!.message !== "string"
        ) {
          return false;
        }

        const _team = this.isTeamMessage(block.data.message);
        return _team === team;
      })
      .sort((left, right) => {
        // sort by most recent first
        return left.timestamp - right.timestamp;
      })
      .slice(0, 25)
      .map(this.convertBlockToChatMessage);
  }

  getPublicChatMessages(): ChatMessage[] {
    if (!this.chains) {
      return [];
    }

    return Array.from(this.chains.values())
      .flat()
      .filter((block) => {
        if (
          !block.data ||
          block.data!.type !== "chat_message" ||
          typeof block.data!.message !== "string"
        ) {
          return false;
        }

        return !this.isTeamMessage(block.data.message);
      })
      .sort((left, right) => {
        // sort by most recent first
        return left.timestamp - right.timestamp;
      })
      .slice(0, 25)
      .map(this.convertBlockToChatMessage);
  }

  getPlayerChatMessages(player: string): ChatMessage[] {
    if (!this.chains) {
      return [];
    }

    return Array.from(this.chains.values())
      .flat()
      .filter((block) => {
        if (
          !block.data ||
          block.data!.type !== "chat_message" ||
          typeof block.data!.message !== "string"
        ) {
          return false;
        }

        const _player = this.isPlayerMessage(block.data.message);
        return _player === player;
      })
      .sort((left, right) => {
        // sort by most recent first
        return left.timestamp - right.timestamp;
      })
      .slice(0, 25)
      .map(this.convertBlockToChatMessage);
  }

  handleChatMessage(message: string, block: Block): void {
    if (!this.broadcast) {
      return;
    }

    const chatMessage = this.convertBlockToChatMessage(block);

    const team = this.isTeamMessage(message);
    if (team) {
      return this.broadcast.cast(
        {
          type: "chat_message_received",
          payload: chatMessage,
        },
        TO_TEAM(team),
      );
    }

    const player = this.isPlayerMessage(message);
    if (player) {
      return this.broadcast.cast(
        {
          type: "chat_message_received",
          payload: chatMessage,
        },
        TO_PLAYER(player),
      );
    }

    return this.broadcast.cast({
      type: "chat_message_received",
      payload: chatMessage,
    });
  }

  private isTeamMessage(message: string): string | undefined {
    const isTeamMessage = message.match(TEAM_REGEX);
    if (isTeamMessage && isTeamMessage.length > 1 && message.length > 4) {
      return isTeamMessage[1]; // e.g. "TST" or "ABC"
    }
    return undefined;
  }

  private isPlayerMessage(message: string): string | undefined {
    const isPlayerMessage = message.match(PLAYER_REGEX);
    if (isPlayerMessage && isPlayerMessage.length > 1 && message.length > 4) {
      return isPlayerMessage[1]; // e.g. "TST" or "ABC"
    }
    return undefined;
  }

  private convertBlockToChatMessage(block: Block): ChatMessage {
    return {
      hashCode: block.hash,
      player: block.player,
      team: block.team,
      identity: block.identity,
      message: block.data!.message as string,
    };
  }
}
