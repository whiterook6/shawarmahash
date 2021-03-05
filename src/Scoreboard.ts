import { Chain } from "./Chain";

export const getTeams = (chain: Chain): string[] => {
  const teams = new Set<string>();
  chain.filter(block => block.team !== "").forEach(block => teams.add(block.team));
  return Array.from(teams);
}

export const getPlayers = (chain: Chain): string[] => {
  const players = new Set<string>();
  chain.forEach(block => players.add(block.player));
  return Array.from(players);
}

export const getPlayerScores = (chain: Chain): Map<string, number> => {
  const scores = new Map<string, number>();
  chain.forEach(block => {
    if (scores.has(block.player)){
      scores.set(block.player, scores.get(block.player) + 1);
    } else {
      scores.set(block.player, 1);
    }
  });

  return scores;
}

export const getTeamScores = (chain: Chain): Map<string, number> => {
  const scores = new Map<string, number>();
  chain.filter(block => block.team !== "").forEach(block => {
    if (scores.has(block.team)){
      scores.set(block.team, scores.get(block.team) + 1);
    } else {
      scores.set(block.team, 1);
    }
  });

  return scores;
}

export const getPlayerScore = (chain: Chain, player: string): number => {
  return chain.filter(block => block.player === player).length;
}

export const getTeamScore = (chain: Chain, team: string): number => {
  return chain.filter(block => block.team === team).length;
}