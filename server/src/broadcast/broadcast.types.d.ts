import type { Block } from "../block/block";
import type { IdentityScore, PlayerScore, TeamScore } from "../score/score";

/** SSE message: connection established */
export type ConnectionMessage = {
  type: "connection";
  payload: {
    status: "open";
  };
};

/** SSE message: team created (genesis block submitted) */
export type TeamCreatedMessage = {
  type: "teamCreated";
  payload: {
    team: string;
    recent: Block[];
    difficulty: string;
  };
};

/** SSE message: block submitted to existing chain */
export type BlockSubmittedMessage = {
  type: "blockSubmitted";
  payload: {
    team: string;
    recent: Block[];
    difficulty: string;
  };
};

/** SSE message: scores update */
export type ScoresUpdateMessage = {
  type: "scoresUpdate";
  payload: {
    activeTeamScores: TeamScore[];
    activePlayerScores: PlayerScore[];
    topPlayers: PlayerScore[];
    topTeams: TeamScore[];
  };
};

/** SSE message: chat message received */
export type ChatMessageReceivedMessage = {
  type: "chatMessageReceived";
  payload: {
    player: string;
    team: string;
    identity: string;
    message: string;
  };
};

/** SSE message: active players list (subscribers with scores) */
export type ActivePlayersMessage = {
  type: "activePlayers";
  payload: Array<IdentityScore>;
};

/** Union of all SSE messages sent from server to UI */
export type BroadcastMessage =
  | ConnectionMessage
  | TeamCreatedMessage
  | BlockSubmittedMessage
  | ScoresUpdateMessage
  | ChatMessageReceivedMessage
  | ActivePlayersMessage;
