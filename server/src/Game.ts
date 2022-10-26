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
    if (chain.length === 0) {
      console.log(
        `Starting game. Empty chain. Target = ${this.targetDifficulty}.`
      );
    } else if (chain.length === 1) {
      console.log(
        `Starting game. One block. Target = ${this.targetDifficulty}.`
      );
    } else {
      console.log(
        `Starting game. ${chain.length} blocks. Target = ${this.targetDifficulty}.`
      );
    }
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

  public getDifficultyTarget = (): string => {
    return this.targetDifficulty;
  };

  public addBlock = (block: object) => {
    const verifiedBlock = verifyIncomingBlock(
      this.chain,
      block,
      this.targetDifficulty
    );
    this.chain = appendBlock(this.chain, verifiedBlock);
    console.log(
      `Block added: #${this.chain.length.toString(10).padStart(4, " ")}: ${
        verifiedBlock.hashCode
      } at ${new Date(verifiedBlock.timestamp * 1000).toISOString()} by ${
        verifiedBlock.team
          ? `@${verifiedBlock.player}#${verifiedBlock.team}`
          : `@${verifiedBlock.player}`
      }`
    );

    if (this.chain.length % 100 === 0) {
      this.targetDifficulty = calculateDifficulty(this.chain);
      console.log(`New Difficulty: ${this.targetDifficulty}`);
    }

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
