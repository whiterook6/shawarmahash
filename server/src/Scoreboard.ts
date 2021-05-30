import { Chain } from "./Chain";

export const getTeams = (chain: Chain): string[] => {
  const teams = new Set<string>();
  chain
    .filter((block) => block.team !== "")
    .forEach((block) => teams.add(block.team));
  return Array.from(teams);
};

export const getPlayers = (chain: Chain): string[] => {
  const players = new Set<string>();
  chain.forEach((block) => players.add(block.player));
  return Array.from(players);
};

export const getPlayerScores = (chain: Chain) => {
  const scores = new Map<string, number>();
  chain.forEach((block) => {
    const player = block.player;

    if (scores.has(player)) {
      scores.set(player, scores.get(player)! + 1);
    } else {
      scores.set(player, 1);
    }
  });

  return scores;
};

export const getTeamScores = (chain: Chain) => {
  const scores = new Map<string, number>();
  chain.forEach((block) => {
    const team = block.team;

    if (!block.team) {
      return;
    } else if (scores.has(team)) {
      scores.set(team, scores.get(team)! + 1);
    } else {
      scores.set(team, 1);
    }
  });

  return scores;
};

export const getPlayerScore = (chain: Chain, player: string): number => {
  return chain.filter((block) => block.player === player).length;
};

export const getTeamScore = (chain: Chain, team: string): number => {
  return chain.filter((block) => block.team === team).length;
};
