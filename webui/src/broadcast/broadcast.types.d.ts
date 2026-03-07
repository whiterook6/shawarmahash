import type {
  ChainStateAPIResponse,
  PlayerWithScoreAPIResponse,
  TeamWithScoreAPIResponse,
} from "../api/api.types";

/**
 * Connection message sent when SSE connection is established
 */
export type ConnectionMessage = {
  type: "connection";
  payload: {
    status: "open";
  };
};

/**
 * Team created message sent when a genesis block is submitted (new team chain created)
 */
export type TeamCreatedMessage = {
  type: "teamCreated";
  payload: ChainStateAPIResponse;
};

/**
 * Block submitted message sent when a regular block is submitted to an existing chain
 */
export type BlockSubmittedMessage = {
  type: "blockSubmitted";
  payload: ChainStateAPIResponse;
};

/**
 * Scores update message sent periodically by the announcer.
 */
export type ScoresUpdateMessage = {
  type: "scoresUpdate";
  payload: {
    activeTeamScores: TeamWithScoreAPIResponse[];
    activePlayerScores: PlayerWithScoreAPIResponse[];
    topPlayers: PlayerWithScoreAPIResponse[];
    topTeams: TeamWithScoreAPIResponse[];
  };
};

/**
 * Chat message received: sent when a chat message is received (block hash, player, team, identity, message).
 */
export type ChatMessageReceivedMessage = {
  type: "chatMessageReceived";
  payload: {
    hashCode: string;
    player: string;
    team: string;
    identity: string;
    message: string;
  };
};

/**
 * Active players list sent periodically (subscribers with scores).
 */
export type ActivePlayersMessage = {
  type: "activePlayers";
  payload: Array<{
    player: string;
    team: string;
    identity: string;
    score: number;
  }>;
};

/**
 * Union type of all possible SSE messages from the server
 */
export type BroadcastMessage =
  | ConnectionMessage
  | TeamCreatedMessage
  | BlockSubmittedMessage
  | ScoresUpdateMessage
  | ChatMessageReceivedMessage
  | ActivePlayersMessage;

/**
 * Callback function type for handling broadcast messages
 */
export type BroadcastCallback = (message: BroadcastMessage) => void;
