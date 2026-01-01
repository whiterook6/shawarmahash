import { Chain } from "./chain";

export type PlayerWithScore = {
  player: string;
  score: number;
};

export const Players = {
  /**
   * Calculates the score for a given player by counting how many blocks they've mined.
   * The genesis block (index 0) is excluded from the count.
   */
  getPlayerScore: (chain: Chain, playerName: string): number => {
    return chain.filter(
      (block) => block.index > 0 && block.player === playerName,
    ).length;
  },

  /**
   * Returns all unique players in the chain with their scores.
   * The genesis block (index 0) is excluded, and empty strings are filtered out.
   * Results are sorted by player name.
   */
  getAllPlayers: (chain: Chain): PlayerWithScore[] => {
    const players = new Set<string>(
      chain
        .filter((block) => block.index > 0 && block.player)
        .map((block) => block.player),
    );
    return Array.from(players)
      .sort()
      .map((player) => ({
        player,
        score: Players.getPlayerScore(chain, player),
      }));
  },
};
