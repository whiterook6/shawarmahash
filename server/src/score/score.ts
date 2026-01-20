import { Chain } from "../chain/chain";

export type PlayerScore = {
  player: string;
  identity: string;
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
   * A single chain may have multiple identities, so this filters the chain by identity then counts the number of blocks.
   */
  getPlayerScore: (chain: Chain, identity: string): number => {
    return Chain.getPlayerBlocks(chain, identity).length;
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
      const key = `${block.player}-${block.identity}`;
      const current = playerScores.get(key) || 0;
      playerScores.set(key, current + 1);
    }

    return Array.from(playerScores.entries())
      .map(([key, score]) => {
        const [player, identity] = key.split("-");
        return {
          player,
          identity,
          score,
        };
      })
      .sort((a, b) => a.player.localeCompare(b.player));
  },
};
