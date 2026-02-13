import type { Block } from "../block/block";
import type { PlayerScore, TeamScore } from "../score/score";

/** SSE message: connection established */
export type ConnectionMessage = {
  type: "connection";
  payload: {
    status: "open";
  };
};

/** SSE message: team created (genesis block submitted) */
export type TeamCreatedMessage = {
  type: "team_created";
  payload: {
    team: string;
    recent: Block[];
    difficulty: string;
  };
};

/** SSE message: block submitted to existing chain */
export type BlockSubmittedMessage = {
  type: "block_submitted";
  payload: {
    team: string;
    recent: Block[];
    difficulty: string;
  };
};

/** SSE message: scores update */
export type ScoresUpdateMessage = {
  type: "scores_update";
  payload: {
    activeTeamScores: TeamScore[];
    activePlayerScores: PlayerScore[];
    topPlayers: PlayerScore[];
    topTeams: TeamScore[];
  };
};

/** SSE message: chat message received */
export type ChatMessageReceivedMessage = {
  type: "chat_message_received";
  payload: {
    player: string;
    team: string;
    identity: string;
    message: string;
  };
};

/** Union of all SSE messages sent from server to UI */
export type BroadcastMessage =
  | ConnectionMessage
  | TeamCreatedMessage
  | BlockSubmittedMessage
  | ScoresUpdateMessage
  | ChatMessageReceivedMessage;
