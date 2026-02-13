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
  type: "team_created";
  payload: ChainStateAPIResponse;
};

/**
 * Block submitted message sent when a regular block is submitted to an existing chain
 */
export type BlockSubmittedMessage = {
  type: "block_submitted";
  payload: ChainStateAPIResponse;
};

/**
 * Scores update message sent periodically by the announcer.
 */
export type ScoresUpdateMessage = {
  type: "scores_update";
  payload: {
    activeTeamScores: TeamWithScoreAPIResponse[];
    activePlayerScores: PlayerWithScoreAPIResponse[];
    topPlayers: PlayerWithScoreAPIResponse[];
    topTeams: TeamWithScoreAPIResponse[];
  };
};

/**
 * Chat message received: sent when a chat message is received (player, team, identity, message).
 */
export type ChatMessageReceivedMessage = {
  type: "chat_message_received";
  payload: {
    player: string;
    team: string;
    identity: string;
    message: string;
  };
};

/**
 * Union type of all possible SSE messages from the server
 */
export type BroadcastMessage =
  | ConnectionMessage
  | TeamCreatedMessage
  | BlockSubmittedMessage
  | ScoresUpdateMessage
  | ChatMessageReceivedMessage;

/**
 * Callback function type for handling broadcast messages
 */
export type BroadcastCallback = (message: BroadcastMessage) => void;
