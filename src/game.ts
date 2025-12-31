import { Chain, calculateDifficulty } from "./chain";
import { Block, calculateHash } from "./block";
import {
  appendBlockToChain,
  getPlayerChainFilePath,
  loadChain,
  saveChain,
} from "./data";
import { getPlayerScore, getAllPlayers } from "./players";
import { getTeamScore, getAllTeams } from "./teams";
import {
  getRecentChatMessages,
  getRecentPlayerMentions,
  getRecentTeamMentions,
} from "./chat";
import { ValidationError } from "./errors";
import { access } from "fs/promises";
import { constants } from "fs";

export class Game {
  chains: Map<string, Chain>;

  constructor() {
    this.chains = new Map();
  }

  private async getOrCreatePlayerChain(player: string): Promise<Chain> {
    // Check if chain exists in memory
    if (this.chains.has(player)) {
      return this.chains.get(player)!;
    }

    // Check if chain file exists on disk
    const chainFilePath = await getPlayerChainFilePath(player);
    try {
      await access(chainFilePath, constants.F_OK);
      const chain = await loadChain(chainFilePath);
      this.chains.set(player, chain);
      return chain;
    } catch {
      // File doesn't exist, create new chain with genesis block containing player's initials
      const genesisBlock: Block = {
        index: 0,
        hash: "0",
        player: player,
        team: "",
        timestamp: Date.now(),
        nonce: 0,
      };
      const chain: Chain = [genesisBlock];
      await saveChain(chain, chainFilePath);
      this.chains.set(player, chain);
      return chain;
    }
  }

  getChainState(player: string) {
    const chain = this.chains.get(player);
    if (!chain) {
      return {
        recent: [],
        difficulty: calculateDifficulty([]),
      };
    }
    const recentChain = chain.slice(-5);
    const difficulty = calculateDifficulty(chain);
    return {
      recent: recentChain.slice().reverse(),
      difficulty: difficulty,
    };
  }

  private async appendBlock(
    newBlock: Block,
    chain: Chain,
    chainFilePath: string,
  ) {
    chain.push(newBlock);
    await appendBlockToChain(newBlock, chainFilePath);
  }

  private aggregateChains<T>(fn: (chain: Chain) => T[]): T[] {
    const allResults: T[] = [];
    for (const chain of this.chains.values()) {
      allResults.push(...fn(chain));
    }
    return allResults;
  }

  getPlayer(player: string): number {
    let totalScore = 0;
    for (const chain of this.chains.values()) {
      totalScore += getPlayerScore(chain, player);
    }
    return totalScore;
  }

  getTeam(team: string): number {
    let totalScore = 0;
    for (const chain of this.chains.values()) {
      totalScore += getTeamScore(chain, team);
    }
    return totalScore;
  }

  getAllTeams() {
    // Aggregate teams across all chains
    const allTeams = new Map<string, number>();
    for (const chain of this.chains.values()) {
      const teams = getAllTeams(chain);
      for (const team of teams) {
        const current = allTeams.get(team.team) || 0;
        allTeams.set(team.team, current + team.score);
      }
    }
    return Array.from(allTeams.entries())
      .map(([team, score]) => ({ team, score }))
      .sort((a, b) => a.team.localeCompare(b.team));
  }

  getAllPlayers() {
    // Aggregate players across all chains
    const allPlayers = new Map<string, number>();
    for (const chain of this.chains.values()) {
      const players = getAllPlayers(chain);
      for (const player of players) {
        const current = allPlayers.get(player.player) || 0;
        allPlayers.set(player.player, current + player.score);
      }
    }
    return Array.from(allPlayers.entries())
      .map(([player, score]) => ({ player, score }))
      .sort((a, b) => a.player.localeCompare(b.player));
  }

  getChat() {
    // Aggregate chat messages from all chains
    const allMessages = this.aggregateChains(getRecentChatMessages);
    // Sort by timestamp descending (newest first) since indices overlap across chains
    return allMessages.sort((a, b) => b.timestamp - a.timestamp);
  }

  getChatPlayer(player: string) {
    // Aggregate chat messages from all chains
    const allMessages = this.aggregateChains((chain) =>
      getRecentPlayerMentions(chain, player),
    );
    // Sort by timestamp descending (newest first) since indices overlap across chains
    return allMessages.sort((a, b) => b.timestamp - a.timestamp);
  }

  getChatTeam(team: string) {
    // Aggregate chat messages from all chains
    const allMessages = this.aggregateChains((chain) =>
      getRecentTeamMentions(chain, team),
    );
    // Sort by timestamp descending (newest first) since indices overlap across chains
    return allMessages.sort((a, b) => b.timestamp - a.timestamp);
  }

  async submitBlock(
    previousHash: string,
    player: string,
    team: string,
    nonce: number,
    providedHash: string,
    message?: string,
  ) {
    // Get or create the player's chain
    const chain = await this.getOrCreatePlayerChain(player);

    // verify the previous hash is correct
    const previousBlock = chain[chain.length - 1];
    if (previousHash !== previousBlock.hash) {
      throw new ValidationError({
        previousHash: [
          `Invalid previous hash: ${previousHash} !== ${previousBlock.hash}`,
        ],
      });
    }

    // verify the provided hash is correct
    const newBlockhash = calculateHash(
      previousBlock.hash,
      previousBlock.timestamp,
      player,
      team,
      nonce,
    );
    if (providedHash !== newBlockhash) {
      throw new ValidationError({
        blockHash: [`Invalid block hash: ${providedHash} !== ${newBlockhash}`],
      });
    }

    // Verify the hash meets difficulty requirement
    const difficulty = calculateDifficulty(chain);
    if (!newBlockhash.startsWith(difficulty)) {
      throw new ValidationError({
        blockHash: [
          `Block does not meet difficulty requirement: ${newBlockhash} does not start with ${difficulty}`,
        ],
      });
    }

    // Create the new block
    const newBlock: Block = {
      index: chain.length,
      hash: newBlockhash,
      player: player,
      team: team,
      timestamp: Date.now(),
      nonce: nonce,
    };
    if (message) {
      newBlock.message = message;
    }

    // Append to chain
    const chainFilePath = await getPlayerChainFilePath(player);
    await this.appendBlock(newBlock, chain, chainFilePath);
    return this.getChainState(player);
  }
}
