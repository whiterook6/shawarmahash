import type { ChainStateAPIResponse } from "../types";

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
 * Union type of all possible SSE messages from the server
 */
export type BroadcastMessage =
  | ConnectionMessage
  | TeamCreatedMessage
  | BlockSubmittedMessage;

/**
 * Callback function type for handling broadcast messages
 */
export type BroadcastCallback = (message: BroadcastMessage) => void;
