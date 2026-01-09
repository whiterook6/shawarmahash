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
   * Currently, a chain only has one team.
   */
  getTeamScore: (chain: Chain): number => {
    return chain.length;
  },

  /**
   * A single chain may have multiple players, so this filters the chain by player then counts the number of blocks.
   */
  getPlayerScore: (chain: Chain, player: string): number => {
    return chain.filter((block) => block.player === player).length;
  },

  /**
   * Currently, a chain only has one team.
   */
  getAllTeamScores: (chain: Chain): TeamScore[] => {
    if (chain.length === 0) {
      return [];
    }
    return [
      {
        team: chain[0].team,
        score: chain.length,
      },
    ];
  },

  /**
   * Collects all the player names from this chain then counts their blocks.
   */
  getAllPlayerScores: (chain: Chain): PlayerScore[] => {
    if (chain.length === 0) {
      return [];
    }

    const playerScores = new Map<string, number>();
    for (const block of chain) {
      if (block.player) {
        const current = playerScores.get(block.player) || 0;
        playerScores.set(block.player, current + 1);
      }
    }

    return Array.from(playerScores.entries())
      .map(([player, score]) => ({ player, score }))
      .sort((a, b) => a.player.localeCompare(b.player));
  },
};
