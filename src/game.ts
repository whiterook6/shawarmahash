import { Chain, DEFAULT_DIFFICULTY } from "./chain";
import { Block } from "./block";
import { Players } from "./players";
import { Teams } from "./teams";
import { Chat } from "./chat";
import { ValidationError } from "./errors";

export class Game {
  private chains: Map<string, Chain> = new Map();

  private getOrCreatePlayerChain(player: string): Chain {
    // Check if chain exists in memory
    if (this.chains.has(player)) {
      return this.chains.get(player)!;
    }

    // Create new chain with genesis block containing player's initials
    const genesisBlock: Block = Block.createGenesisBlock(player);
    const chain: Chain = [genesisBlock];
    this.chains.set(player, chain);
    return chain;
  }

  getChainState(player: string) {
    const chain = this.chains.get(player) || this.getOrCreatePlayerChain(player);
    const recentChain = chain.slice(-5);
    const difficulty = Chain.calculateDifficulty(chain);
    return {
      recent: recentChain.slice(),
      difficulty: difficulty,
    };
  }

  private appendBlock(newBlock: Block, chain: Chain) {
    chain.push(newBlock);
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
      totalScore += Players.getPlayerScore(chain, player);
    }
    return totalScore;
  }

  getTeam(team: string): number {
    let totalScore = 0;
    for (const chain of this.chains.values()) {
      totalScore += Teams.getTeamScore(chain, team);
    }
    return totalScore;
  }

  getAllTeams() {
    // Aggregate teams across all chains
    const allTeams = new Map<string, number>();
    for (const chain of this.chains.values()) {
      const teams = Teams.getAllTeams(chain);
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
      const players = Players.getAllPlayers(chain);
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
    const allMessages = this.aggregateChains((chain) =>
      Chat.getRecentChatMessages(chain),
    );
    // Sort by timestamp descending (newest first) since indices overlap across chains
    return allMessages.sort((a, b) => b.timestamp - a.timestamp);
  }

  getChatPlayer(player: string) {
    // Aggregate chat messages from all chains
    const allMessages = this.aggregateChains((chain) =>
      Chat.getRecentPlayerMentions(chain, player),
    );
    // Sort by timestamp descending (newest first) since indices overlap across chains
    return allMessages.sort((a, b) => b.timestamp - a.timestamp);
  }

  getChatTeam(team: string) {
    // Aggregate chat messages from all chains
    const allMessages = this.aggregateChains((chain) =>
      Chat.getRecentTeamMentions(chain, team),
    );
    // Sort by timestamp descending (newest first) since indices overlap across chains
    return allMessages.sort((a, b) => b.timestamp - a.timestamp);
  }

  submitBlock(
    previousHash: string,
    player: string,
    team: string | undefined,
    nonce: number,
    providedHash: string,
    message?: string,
  ) {
    // Get or create the player's chain
    const chain = this.getOrCreatePlayerChain(player);

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
    const newBlockhash = Block.calculateHash(
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
    const difficulty = Chain.calculateDifficulty(chain);
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
      previousHash: previousBlock.hash,
      player: player,
      timestamp: Date.now(),
      nonce: nonce,
    };
    if (team) {
      newBlock.team = team;
    }
    if (message) {
      newBlock.message = message;
    }

    // Append to chain
    this.appendBlock(newBlock, chain);
    return this.getChainState(player);
  }
}
