import { Block } from "./Block";
import {
  appendBlock,
  calculateDifficulty,
  Chain,
  verifyIncomingBlock,
} from "./Chain";
import {
  getPlayers,
  getPlayerScore,
  getTeams,
  getTeamScore,
} from "./Scoreboard";

export class Game {
  private chain: Chain;
  private targetDifficulty: string;

  constructor(chain: Chain = []) {
    this.chain = chain;
    this.targetDifficulty = calculateDifficulty(chain);
  }

  public getPreviousHash = () => {
    if (this.chain.length === 0) {
      return "0";
    } else {
      return this.getHighestBlock().previousHash;
    }
  };

  public getPlayers = (): string[] => {
    return getPlayers(this.chain);
  };

  public getPlayerScore = (player: string) => {
    return getPlayerScore(this.chain, player);
  };

  public getPlayerBlocks = (player: string): Block[] => {
    return this.chain
      .filter((block) => block.player === player)
      .map((block) => {
        return {
          ...block,
        } as Block;
      });
  };

  public getTeams = (): string[] => {
    return getTeams(this.chain);
  };

  public getTeamScore = (team: string) => {
    return getTeamScore(this.chain, team);
  };

  public getTeamBlocks = (team: string) => {
    return this.chain
      .filter((block) => block.team === team)
      .map((block) => {
        return {
          ...block,
        } as Block;
      });
  };

  public addBlock = (block: object) => {
    const verifiedBlock = verifyIncomingBlock(
      this.chain,
      block,
      this.targetDifficulty
    );
    this.chain = appendBlock(this.chain, verifiedBlock);
    return verifiedBlock;
  };

  public getHeight = () => this.chain.length;

  public getBlockAt = (height: number) => {
    if (this.chain.length === 0) {
      throw new Error("Cannot find block: chain is empty.");
    } else if (this.chain.length <= height) {
      throw new Error(
        `Cannot find block. Requested block ${height}, but highest block is ${
          this.chain.length - 1
        }.`
      );
    }

    return this.chain[height];
  };

  public getHighestBlock = () => {
    if (this.chain.length === 0) {
      throw new Error("Cannot get highest block: chain is empty.");
    }

    return this.chain[this.chain.length - 1];
  };

  public getRecentBlocks = () => {
    return this.chain.slice(-10);
  };

  public getChain = () => this.chain;
}
