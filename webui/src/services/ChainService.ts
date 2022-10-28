import { Chain } from "../Block";

export const getTeams = (chain: Chain) => {
  return [...new Set<string>(chain.map(block => block.team).filter(Boolean))];
};

export const getPlayers = (chain: Chain) => {
  return [...new Set<string>(chain.map(block => block.player).filter(Boolean))];
};

export const getTopTeams = (chain: Chain, count: number = 10): [string, number][] => {
  const scores = new Map<string, number>();
  chain.forEach(block => {
    if (block.team) {
      const score = scores.get(block.team) || 0;
      scores.set(block.team, score + 1);
    }
  });

  const entries = [...scores.entries()];
  entries.sort((a, b) => b[1] - a[1]);
  return entries.slice(0, count);
};

export const getTopPlayers = (chain: Chain, count: number = 10): [string, number][] => {
  const scores = new Map<string, number>();
  chain.forEach(block => {
    if (block.player) {
      const score = scores.get(block.player) || 0;
      scores.set(block.player, score + 1);
    }
  });

  const entries = [...scores.entries()];
  entries.sort((a, b) => b[1] - a[1]);
  return entries.slice(0, count);
};