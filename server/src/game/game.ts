import { Mutex, MutexInterface } from "async-mutex";
import { Block } from "../block/block";
import { Broadcast } from "../broadcast/broadcast";
import { Chain } from "../chain/chain";
import { Data } from "../data/data";
import { Difficulty } from "../difficulty/difficulty";
import { NotFoundError, ValidationError } from "../error/errors";
import { PlayerScore, Score, TeamScore } from "../score/score";
import { Timestamp } from "../timestamp/timestamp";
import { Player } from "../player/player";

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

  getPlayerScore(identity: string): number {
    let totalScore = 0;
    for (const chain of this.chains.values()) {
      totalScore += Score.getPlayerScore(chain, identity);
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
    const allPlayers = new Map<string, PlayerScore>();
    for (const chain of this.chains.values()) {
      const playerScores = Score.getAllPlayerScores(chain);
      for (const playerScore of playerScores) {
        const key = `${playerScore.player}-${playerScore.identity}`;
        const current = allPlayers.get(key) || {
          player: playerScore.player,
          identity: playerScore.identity,
          score: 0,
        };
        current.score += playerScore.score;
        allPlayers.set(key, current);
      }
    }

    return Array.from(allPlayers.values()).sort((a, b) =>
      a.player.localeCompare(b.player),
    );
  }

  getTopTeams(): TeamScore[] {
    const allTeamScores = this.getAllTeamScores();
    return allTeamScores.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  getTopPlayers(): PlayerScore[] {
    const allPlayerScore = this.getAllPlayerScores();
    return allPlayerScore.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  getPlayerTeam(player: Player): string | undefined {
    const mostRecentPlayerBlock = this.aggregateChains((chain) =>
      chain.filter(
        (block) =>
          block.player === player.player && block.identity === player.identity,
      ),
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

  getTeamPlayers(team: string): Player[] {
    const chain = this.chains.get(team);
    if (!chain) {
      throw new NotFoundError(`Team ${team} not found`);
    }

    const keys = new Set<string>();
    const players = new Set<Player>();
    for (const block of chain) {
      const key = `${block.player}-${block.identity}`;
      if (!keys.has(key)) {
        keys.add(key);
        players.add({ player: block.player, identity: block.identity });
      }
    }

    return Array.from(players).sort((a, b) => a.player.localeCompare(b.player));
  }

  async submitBlock(args: {
    previousHash: string;
    hash: string;
    player: string;
    identity: string;
    team: string;
    nonce: number;
  }): Promise<{ recent: Block[]; difficulty: string }> {
    const { team, previousHash, identity } = args;
    const isGenesisBlock = previousHash === Block.GENESIS_PREVIOUS_HASH;
    let newBlock: Block;

    const mutex = this.getTeamMutex(team);
    await mutex.acquire();
    try {
      const chainExists = this.chains.has(team);

      if (isGenesisBlock && chainExists) {
        throw new ValidationError({
          team: [
            `Team ${team} already exists. Cannot submit genesis block to existing chain.`,
          ],
        });
      } else if (isGenesisBlock) {
        newBlock = {
          ...args,
          index: 0,
          timestamp: Timestamp.now(),
          identity,
        };

        const error = Chain.verifyGenesisBlock(newBlock);
        if (error) {
          throw new ValidationError({
            team: [`Invalid genesis block: ${error}`],
          });
        }

        await this.initializeTeamChain(newBlock);
      } else if (!chainExists) {
        throw new ValidationError({
          team: [`Team ${team} does not exist. Mine a genesis block first.`],
        });
      } else {
        const teamChain = this.chains.get(team)!;

        // Create the new block
        newBlock = Chain.verifyIncomingBlock(args, teamChain);

        // Append to chain and persist to data layer
        await this.appendBlock(newBlock, teamChain, team);
      }
    } finally {
      mutex.release();
    }

    const chainState = this.getChainState(team);
    const broadcastType = isGenesisBlock ? "team_created" : "block_submitted";
    this.broadcast?.cast({
      type: broadcastType,
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
