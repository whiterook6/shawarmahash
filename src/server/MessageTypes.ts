import {Block} from "../Block";

// Incoming

export type IncBlockFound = {
  event: "block-found",
  data: {
    block: Block;
  }
};

export type IncChangeName = {
  event: "change-name",
  data: {
    newName: string;
  }
};

export type incChangeTeam = {
  event: "change-team",
  data: {
    newTeam: string;
  }
};

export type IncChat = {
  event: "chat",
  data: {
    message: string;
  }
};

// Outgoing

export type OutChat = {
  event: "chat",
  data: {
    from: string;
    message: string;
  }
};

export type OutBlockFound = {
  event: "block-found",
  data: {
    block: Block;
  }
};

export type OutPlayerScore = {
  event: "player-score",
  data: {
    player: string;
    score: number;
  }
};

export type outTeamScore = {
  event: "team-score",
  data: {
    team: string;
    score: number;
  }
};