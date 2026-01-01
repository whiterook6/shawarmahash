import { Chain } from "./chain";

export type TeamWithScore = {
  team: string;
  score: number;
};

export const Teams = {
  /**
   * Calculates the score for a given team by counting how many blocks team members have mined.
   * The genesis block (index 0) is excluded from the count.
   */
  getTeamScore: (chain: Chain, teamName: string): number => {
    return chain.filter((block) => block.index > 0 && block.team === teamName)
      .length;
  },

  /**
   * Returns all unique teams in the chain with their scores.
   * The genesis block (index 0) is excluded, and undefined teams are filtered out.
   * Results are sorted by team name.
   */
  getAllTeams: (chain: Chain): TeamWithScore[] => {
    const teams = new Set<string>(
      chain
        .filter((block) => block.hash !== "0000000000000000000000000000000000000000000000000000000000000000" && block.team)
        .map((block) => block.team!),
    );
    return Array.from(teams)
      .sort()
      .map((team) => ({
        team,
        score: Teams.getTeamScore(chain, team),
      }));
  },
};
