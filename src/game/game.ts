import { Chain } from "../chain/chain";
import { Block } from "../block/block";
import { Chat } from "../chat/chat";
import { NotFoundError, ValidationError } from "../error/errors";
import { Data } from "../data/data";
import { Difficulty } from "../difficulty/difficulty";
import { PlayerScore, Score, TeamScore } from "../score/score";
import { Timestamp } from "../timestamp/timestamp";

export type ChainState = {
  recent: Block[];
  difficulty: string;
};

export class Game {
  constructor(private readonly chains: Map<string, Chain>) {}

  getChainState(player: string): ChainState {
    const chain = this.chains.get(player);
    if (!chain) {
      return {
        recent: [],
        difficulty: Difficulty.DEFAULT_DIFFICULTY_HASH,
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
    hash: string,
    nonce: number,
  ): Promise<{ recent: Block[]; difficulty: string }> {
    // Check if chain already exists
    if (this.chains.has(player)) {
      throw new ValidationError({
        player: [`Player ${player} already exists`],
      });
    }

    // Validate genesis block hash
    const expectedHash = Block.calculateHash(
      "0000000000000000000000000000000000000000000000000000000000000000",
      0, // previous timestamp is 0 for genesis block
      player,
      undefined, // no team for genesis block
      nonce,
    );

    if (hash !== expectedHash) {
      throw new ValidationError({
        hash: [`Invalid genesis block hash: ${hash} !== ${expectedHash}`],
      });
    }

    // Verify the hash meets difficulty requirement
    if (!Difficulty.isDifficultyMet(hash, Difficulty.DEFAULT_DIFFICULTY_HASH)) {
      throw new ValidationError({
        hash: [
          `Genesis block does not meet difficulty requirement: ${hash} does not start with ${Difficulty.DEFAULT_DIFFICULTY_HASH}`,
        ],
      });
    }

    // Initialize new player chain with welcome message
    const message = `Are you ready for a story?`;
    await this.initializePlayerChain(player, hash, nonce, message);

    // Return the recent chain state
    return this.getChainState(player);
  }

  getPlayerTeam(player: string): string | undefined {
    const chain = this.chains.get(player);
    if (!chain) {
      throw new NotFoundError(`Player ${player} not found`);
    }
    return chain[chain.length - 1].team;
  }

  getPlayerScore(player: string): number {
    const chain = this.chains.get(player);
    if (!chain) {
      throw new NotFoundError(`Player ${player} not found`);
    }
    return Score.getPlayerScore(chain);
  }

  getTeamScore(team: string): number {
    let totalScore = 0;
    for (const chain of this.chains.values()) {
      totalScore += Score.getTeamScore(chain, team);
    }
    return totalScore;
  }

  getAllPlayerScores(): PlayerScore[] {
    return Array.from(this.chains.entries())
      .map(([player, chain]) => ({
        player,
        score: Score.getPlayerScore(chain),
      }))
      .sort((a, b) => a.player.localeCompare(b.player));
  }

  getAllTeamScores(): TeamScore[] {
    const allTeams = new Map<string, number>();
    for (const chain of this.chains.values()) {
      const teamScores = Score.getAllTeamScores(chain);
      for (const teamScore of teamScores) {
        const current = allTeams.get(teamScore.team) || 0;
        allTeams.set(teamScore.team, current + teamScore.score);
      }
    }

    return Array.from(allTeams.entries())
      .sort(([teamA], [teamB]) => teamA.localeCompare(teamB))
      .map(([team, score]) => ({ team, score }));
  }

  getChat(): Block[] {
    // Aggregate chat messages from all chains
    const allMessages = this.aggregateChains((chain) =>
      Chat.getChatMessages(chain),
    );
    // Sort by timestamp descending (newest first) since indices overlap across chains
    return allMessages.sort((a, b) => b.timestamp - a.timestamp);
  }

  getPlayerMessages(player: string): Block[] {
    // Aggregate chat messages from all chains
    const allMessages = this.aggregateChains((chain) =>
      Chat.getPlayerMentions(chain, player),
    );
    // Sort by timestamp descending (newest first) since indices overlap across chains
    return allMessages.sort((a, b) => b.timestamp - a.timestamp);
  }

  getTeamMessages(team: string): Block[] {
    // Aggregate chat messages from all chains
    const allMessages = this.aggregateChains((chain) =>
      Chat.getTeamMentions(chain, team),
    );
    // Sort by timestamp descending (newest first) since indices overlap across chains
    return allMessages.sort((a, b) => b.timestamp - a.timestamp);
  }

  getTeamPlayers(team: string): string[] {
    const playerNames = new Set<string>();
    for (const chain of this.chains.values()) {
      for (const block of chain) {
        if (block.team === team) {
          playerNames.add(block.player);
        }
      }
    }
    return Array.from(playerNames).sort((a, b) => a.localeCompare(b));
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
      timestamp: Timestamp.now(),
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

  /**
   * Initializes a new player chain with a genesis block.
   * This is the single point where player creation happens,
   * making it easy to add callbacks or other logic later.
   */
  private async initializePlayerChain(
    player: string,
    hash: string,
    nonce: number,
    message?: string,
  ): Promise<Chain> {
    // Create genesis block using provided hash and nonce
    const genesisBlock: Block = {
      hash: hash,
      previousHash:
        "0000000000000000000000000000000000000000000000000000000000000000",
      player: player,
      timestamp: Timestamp.now(),
      nonce: nonce,
      index: 0,
      message: message,
    };

    const chain: Chain = [genesisBlock];
    this.chains.set(player, chain);

    // Save genesis block to file
    await Data.appendBlocks(player, [genesisBlock]);

    // TODO: Add callbacks here if needed (e.g., onPlayerCreated callback)

    return chain;
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
}
