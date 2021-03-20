import { Block } from "./Block";

// Incoming
export type IncChangeName = {
  event: "change-name";
  data: {
    newName: string;
  };
};

export type IncChangeTeam = {
  event: "change-team";
  data: {
    newTeam: string;
  };
};

export type IncChat = {
  event: "chat";
  data: {
    message: string;
  };
};

export type IncLeaveTeam = {
  event: "leave-team";
};

// Outgoing
export type OutChat = {
  event: "chat";
  data: {
    from: string;
    message: string;
  };
};

export type OutBlockFound = {
  event: "block-found";
  data: {
    block: Block;
  };
};

export type OutPlayerScore = {
  event: "player-score";
  data: {
    player: string;
    score: number;
  };
};

export type outTeamScore = {
  event: "team-score";
  data: {
    team: string;
    score: number;
  };
};
