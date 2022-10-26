import { Block } from "./Block";

/** Sent to clients via server side events. Type = "block-found" */
export type BlockFoundMSG = {
  block: Block;
  difficultyTarget: string;
};
