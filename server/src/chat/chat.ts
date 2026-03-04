import { Block } from "../block/block";
import { Broadcast, TO_PLAYER, TO_TEAM } from "../broadcast/broadcast";
import { DatabaseController } from "../database/database.controller";
import { ChatMessage } from "./chat.types";

const PLAYER_REGEX = /^@([A-Z]{3})\b/;
const TEAM_REGEX = /^#([A-Z]{3})\b/;
const MESSAGE_MAX_LENGTH = 1024;

export class Chat {
  private broadcast: Broadcast | undefined = undefined;
  private database: DatabaseController | undefined = undefined;

  setDatabase(database: DatabaseController): void {
    this.database = database;
  }

  setBroadcast(broadcast: Broadcast): void {
    this.broadcast = broadcast;
  }

  getTeamChatMessages(team: string): ChatMessage[] {
    if (!this.database) {
      return [];
    }

    const rows = this.database
      .prepare(
        `SELECT id, from_player, from_team, from_identity, message
         FROM messages
         WHERE to_team = :team
         ORDER BY created_at DESC
         LIMIT 25`,
      )
      .all({ team }) as {
      id: string;
      from_player: string;
      from_team: string;
      from_identity: string;
      message: string;
    }[];

    return rows.map((row) => ({
      hashCode: row.id,
      player: row.from_player,
      team: row.from_team,
      identity: row.from_identity,
      message: row.message,
    }));
  }

  getPublicChatMessages(): ChatMessage[] {
    if (!this.database) {
      return [];
    }

    const rows = this.database
      .prepare(
        `SELECT id, from_player, from_team, from_identity, message
         FROM messages
         WHERE to_team IS NULL AND to_player IS NULL
         ORDER BY created_at DESC
         LIMIT 25`,
      )
      .all() as {
      id: string;
      from_player: string;
      from_team: string;
      from_identity: string;
      message: string;
    }[];

    return rows.map((row) => ({
      hashCode: row.id,
      player: row.from_player,
      team: row.from_team,
      identity: row.from_identity,
      message: row.message,
    }));
  }

  getPlayerChatMessages(player: string): ChatMessage[] {
    if (!this.database) {
      return [];
    }

    const rows = this.database
      .prepare(
        `SELECT id, from_player, from_team, from_identity, message
         FROM messages
         WHERE to_player = :player
         ORDER BY created_at DESC
         LIMIT 25`,
      )
      .all({ player }) as {
      id: string;
      from_player: string;
      from_team: string;
      from_identity: string;
      message: string;
    }[];

    return rows.map((row) => ({
      hashCode: row.id,
      player: row.from_player,
      team: row.from_team,
      identity: row.from_identity,
      message: row.message,
    }));
  }

  handleChatMessage(message: string, block: Block): void {
    if (this.database) {
      this.insertMessage(block, message);
    }

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

  insertMessage(block: Block, message: string): void {
    if (!this.database) {
      return;
    }

    const trimmed = message.trim();
    if (trimmed.length === 0) {
      return;
    }

    const messageToStore =
      trimmed.length > MESSAGE_MAX_LENGTH
        ? trimmed.slice(0, MESSAGE_MAX_LENGTH)
        : trimmed;

    const toTeam = this.isTeamMessage(message) ?? null;
    const toPlayer = this.isPlayerMessage(message) ?? null;

    this.database
      .prepare(
        `INSERT OR IGNORE INTO players (identity, player, team) VALUES (?, ?, ?)`,
      )
      .run(block.identity, block.player, block.team);

    this.database
      .prepare(
        `INSERT OR IGNORE INTO messages (id, reply_to, from_identity, from_player, from_team, to_team, to_player, message, created_at)
         VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        block.hash,
        block.identity,
        block.player,
        block.team,
        toTeam,
        toPlayer,
        messageToStore,
        block.timestamp,
      );
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
