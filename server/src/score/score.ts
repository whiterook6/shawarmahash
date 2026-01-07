import { Chain } from "../chain/chain";

export type PlayerScore = {
  player: string;
  score: number;
};

export type TeamScore = {
  team: string;
  score: number;
};

export const Score = {
  /**
   * Currently, a chain only has one player.
   */
  getPlayerScore: (chain: Chain): number => {
    return chain.length;
  },

  /**
   * A single chain may have multiple teams, so this filters the chain by team then counts the number of blocks.
   */
  getTeamScore: (chain: Chain, team: string): number => {
    return chain.filter((block) => block.team === team).length;
  },

  /**
   * Currently, a chain only has one player.
   */
  getAllPlayerScores: (chain: Chain): PlayerScore[] => {
    if (chain.length === 0) {
      return [];
    }
    return [
      {
        player: chain[0].player,
        score: chain.length,
      },
    ];
  },

  /**
   * Collects all the team names from this chain then counts their blocks.
   */
  getAllTeamScores: (chain: Chain): TeamScore[] => {
    if (chain.length === 0) {
      return [];
    }

    const teamScores = new Map<string, number>();
    for (const block of chain) {
      if (block.team) {
        const current = teamScores.get(block.team) || 0;
        teamScores.set(block.team, current + 1);
      }
    }
    return Array.from(teamScores.entries())
      .map(([team, score]) => ({ team, score }))
      .sort((a, b) => a.team.localeCompare(b.team));
  },
};
