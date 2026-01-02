import { Chain } from "./chain";
import { Block } from "./block";
import { Players } from "./players";
import { Teams } from "./teams";
import { Chat } from "./chat";
import { ValidationError } from "./errors";
import { Data } from "./data";
import { Difficulty } from "./difficulty";

export type ChainState = {
  recent: Block[];
  difficulty: string;
};

export class Game {
  constructor(private readonly chains: Map<string, Chain>) {}

  /**
   * Creates a genesis block for a player.
   * This is the single point where genesis blocks are created,
   * making it easy to add callbacks or other logic later.
   */
  createGenesisBlock(player: string, message?: string): Block {
    return Block.createGenesisBlock(player, message);
  }

  /**
   * Initializes a new player chain with a genesis block.
   * This is the single point where player creation happens,
   * making it easy to add callbacks or other logic later.
   */
  private async initializePlayerChain(
    player: string,
    message?: string,
  ): Promise<Chain> {
    // Create new chain with genesis block using the consolidated method
    const genesisBlock: Block = this.createGenesisBlock(player, message);
    const chain: Chain = [genesisBlock];
    this.chains.set(player, chain);

    // Save genesis block to file
    await Data.appendBlocks(player, [genesisBlock]);

    // TODO: Add callbacks here if needed (e.g., onPlayerCreated callback)

    return chain;
  }

  async getChainState(player: string): Promise<ChainState> {
    // Note: This auto-creates chains but doesn't persist them.
    // Use createPlayer() for explicit player creation with persistence.
    const chain = this.chains.get(player);
    if (!chain) {
      // Auto-create in memory only (for backward compatibility)
      const chain = await this.initializePlayerChain(player);
      this.chains.set(player, chain);
      const recentChain = chain.slice(-5);
      const difficulty = Difficulty.DEFAULT_DIFFICULTY_HASH;
      return {
        recent: recentChain.slice(),
        difficulty: difficulty,
      };
    }

    const difficulty = Difficulty.getDifficultyTargetFromChain(chain);
    return {
      recent: chain.slice(-5),
      difficulty: difficulty,
    };
  }

  async createPlayer(
    player: string,
  ): Promise<{ recent: Block[]; difficulty: string }> {
    // Check if chain already exists
    if (!this.chains.has(player)) {
      // Initialize new player chain with welcome message
      const message = `Are you ready for a story?`;
      await this.initializePlayerChain(player, message);
    }

    // Return the recent chain state
    return this.getChainState(player);
  }

  /**
   * Appends a block to the chain and persists it to the data layer.
   * This is the single point where blocks are appended,
   * making it easy to add callbacks or other logic later.
   */
  private async appendBlock(
    newBlock: Block,
    chain: Chain,
    player: string,
  ): Promise<void> {
    chain.push(newBlock);

    // Persist block to file
    await Data.appendBlocks(player, [newBlock]);

    // TODO: Add callbacks here if needed (e.g., onBlockAppended callback)
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

  async submitBlock(
    previousHash: string,
    player: string,
    team: string | undefined,
    nonce: number,
    providedHash: string,
    message?: string,
  ) {
    // Check if chain exists - don't auto-create
    if (!this.chains.has(player)) {
      throw new ValidationError({
        player: [
          `Player ${player} must initialize their chain before submitting blocks`,
        ],
      });
    }
    const chain = this.chains.get(player)!;

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
    const difficultyTarget = Difficulty.getDifficultyTargetFromChain(chain);
    if (!Difficulty.isDifficultyMet(newBlockhash, difficultyTarget)) {
      throw new ValidationError({
        blockHash: [
          `Block does not meet difficulty requirement: ${newBlockhash} does not start with ${difficultyTarget}`,
        ],
      });
    }

    // Create the new block
    const newBlock: Block = {
      hash: newBlockhash,
      previousHash: previousBlock.hash,
      player: player,
      timestamp: Math.floor(Date.now() / 1000),
      nonce: nonce,
      index: previousBlock.index + 1,
    };
    if (team) {
      newBlock.team = team;
    }
    if (message) {
      newBlock.message = message;
    }

    // Append to chain and persist to data layer
    await this.appendBlock(newBlock, chain, player);
    return this.getChainState(player);
  }
}
