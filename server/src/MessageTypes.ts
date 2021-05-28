import { Block } from "./Block";

export type SetIDMSG = {
  event: "set-id";
  player: string;
  team: string;
}

export type BlockFoundMSG = {
  event: "block-found";
  block: Block;
  difficultyTarget: string;
}