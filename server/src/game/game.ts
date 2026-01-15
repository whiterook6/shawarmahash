import { Chain } from "../chain/chain";
import { Block } from "../block/block";
import { Chat } from "../chat/chat";
import { NotFoundError, ValidationError } from "../error/errors";
import { Data } from "../data/data";
import { Difficulty } from "../difficulty/difficulty";
import { PlayerScore, Score, TeamScore } from "../score/score";
import { Timestamp } from "../timestamp/timestamp";
import { Broadcast } from "../broadcast/broadcast";
import { Mutex, MutexInterface } from "async-mutex";

export type ChainState = {
  recent: Block[];
  difficulty: string;
};

export class Game {
  /** Map teams to chains */
  private teamMutexes: Map<string, MutexInterface> = new Map<
    string,
    MutexInterface
  >();
  private chains: Map<string, Chain> = new Map<string, Chain>();
  private broadcast: Broadcast | undefined = undefined;
  private data: Data | undefined = undefined;

  private getTeamMutex(team: string): MutexInterface {
    if (!this.teamMutexes.has(team)) {
      this.teamMutexes.set(team, new Mutex());
    }
    return this.teamMutexes.get(team)!;
  }

  setBroadcast(broadcast: Broadcast): void {
    this.broadcast = broadcast;
  }

  setData(data: Data): void {
    this.data = data;
  }

  setChains(chains: Map<string, Chain>): void {
    this.chains = chains;
  }

  getChainState(team: string): ChainState {
    const chain = this.chains.get(team);
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

  getTeamScore(team: string): number {
    const chain = this.chains.get(team);
    if (!chain) {
      throw new NotFoundError(`Team ${team} not found`);
    }
    return Score.getTeamScore(chain);
  }

  getPlayerScore(player: string): number {
    let totalScore = 0;
    for (const chain of this.chains.values()) {
      totalScore += Score.getPlayerScore(chain, player);
    }
    return totalScore;
  }

  getAllTeamScores(): TeamScore[] {
    return Array.from(this.chains.entries())
      .map(([team, chain]) => ({
        team,
        score: Score.getTeamScore(chain),
      }))
      .sort((a, b) => a.team.localeCompare(b.team));
  }

  getAllPlayerScores(): PlayerScore[] {
    const allPlayers = new Map<string, number>();
    for (const chain of this.chains.values()) {
      const playerScores = Score.getAllPlayerScores(chain);
      for (const playerScore of playerScores) {
        const current = allPlayers.get(playerScore.player) || 0;
        allPlayers.set(playerScore.player, current + playerScore.score);
      }
    }

    return Array.from(allPlayers.entries())
      .sort(([playerA], [playerB]) => playerA.localeCompare(playerB))
      .map(([player, score]) => ({ player, score }));
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

  getPlayerTeam(player: string): string | undefined {
    const mostRecentPlayerBlock = this.aggregateChains((chain) =>
      chain.filter((block) => block.player === player),
    ).reduce((acc: Block | undefined, val: Block) => {
      if (!acc) {
        return val;
      } else if (val.timestamp > acc.timestamp) {
        return val;
      } else {
        return acc;
      }
    }, undefined);

    return mostRecentPlayerBlock?.team;
  }

  getTeamPlayers(team: string): string[] {
    const chain = this.chains.get(team);
    if (!chain) {
      throw new NotFoundError(`Team ${team} not found`);
    }

    return [...new Set(chain.map((block) => block.player))].sort(
      (playerA, playerB) => playerA.localeCompare(playerB),
    );
  }

  async createTeam(args: {
    team: string;
    player: string;
    hash: string;
    nonce: number;
  }): Promise<{ recent: Block[]; difficulty: string }> {
    const { team, player, hash, nonce } = args;
    const mutex = this.getTeamMutex(team);
    await mutex.acquire();
    try {
      // Check if chain already exists
      if (this.chains.has(team)) {
        throw new ValidationError({
          team: [`Team ${team} already exists`],
        });
      }

      const genesisBlock: Block = {
        hash,
        previousHash: Block.GENESIS_PREVIOUS_HASH,
        player,
        team,
        timestamp: Timestamp.now(),
        nonce,
        index: 0,
        message: `Are you ready for a story?`,
      };

      const error = Chain.verifyGenesisBlock(genesisBlock);
      if (error) {
        throw new ValidationError({
          team: [`Invalid genesis block: ${error}`],
        });
      }

      await this.initializeTeamChain(genesisBlock);
    } finally {
      mutex.release();
    }

    // Return the recent chain state
    const chainState = this.getChainState(team);
    this.broadcast!.cast({
      type: "team_created",
      payload: chainState,
    });
    return chainState;
  }

  async submitBlock(args: {
    previousHash: string;
    player: string;
    team: string;
    nonce: number;
    hash: string;
    message?: string;
  }) {
    const { team } = args;
    const mutex = this.getTeamMutex(team);
    await mutex.acquire();
    try {
      if (!this.chains.has(team)) {
        throw new ValidationError({
          team: [
            `Team ${team} must initialize their chain before submitting blocks`,
          ],
        });
      }
      const teamChain = this.chains.get(team)!;

      // Create the new block
      const newBlock: Block = Chain.verifyIncomingBlock(args, teamChain);

      // Append to chain and persist to data layer
      await this.appendBlock(newBlock, teamChain, team);
    } finally {
      mutex.release();
    }

    const chainState = this.getChainState(team);
    this.broadcast?.cast({
      type: "block_submitted",
      payload: chainState,
    });
    return chainState;
  }

  /**
   * Initializes a new team chain with a genesis block.
   * This is the single point where team creation happens,
   * making it easy to add callbacks or other logic later.
   */
  private async initializeTeamChain(genesisBlock: Block): Promise<Chain> {
    const team = genesisBlock.team;
    const chain: Chain = [genesisBlock];
    this.chains.set(team, chain);

    // Save genesis block to file
    await this.data!.createChainFile(team);
    await this.data!.appendBlocks(team, [genesisBlock]);
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
    team: string,
  ): Promise<void> {
    chain.push(newBlock);

    // Persist block to file
    await this.data!.appendBlocks(team, [newBlock]);

    // TODO: Add callbacks here if needed (e.g., onBlockAppended callback)
  }

  getActiveChainsCount(): number {
    return this.chains.size;
  }

  getTotalBlocksCount(): number {
    let total = 0;
    for (const chain of this.chains.values()) {
      total += chain.length;
    }
    return total;
  }

  private aggregateChains<T>(fn: (chain: Chain) => T[]): T[] {
    const allResults: T[] = [];
    for (const chain of this.chains.values()) {
      allResults.push(...fn(chain));
    }
    return allResults;
  }
}
