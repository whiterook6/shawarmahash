import { Chain, calculateDifficulty } from "./chain";
import { Block, calculateHash } from "./block";
import { appendBlockToChain } from "./data";
import { getPlayerScore, getAllPlayers } from "./players";
import { getTeamScore, getAllTeams } from "./teams";
import { getRecentChatMessages, getRecentPlayerMentions, getRecentTeamMentions } from "./chat";
import { mineBlock } from "./miner";
import { ValidationError } from "./errors";

export class Game {
  chain: Chain;
  recentChain: Chain;
  difficulty: string;
  chainFilePath: string;

  constructor(chain: Chain, chainFilePath: string) {
    this.chain = chain;
    this.recentChain = chain.slice(-5);
    this.difficulty = calculateDifficulty(chain);
    this.chainFilePath = chainFilePath;
  }

  getChainState() {
    return {
      recent: this.recentChain.slice().reverse(),
      difficulty: this.difficulty,
    };
  }

  private async appendBlock(newBlock: Block) {
    this.chain.push(newBlock);
    this.recentChain = this.chain.slice(-5);
    this.difficulty = calculateDifficulty(this.chain);
    await appendBlockToChain(newBlock, this.chainFilePath);
  }

  getPlayer(player: string): number {
    return getPlayerScore(this.chain, player);
  }

  getTeam(team: string): number {
    return getTeamScore(this.chain, team);
  }

  getAllTeams() {
    return getAllTeams(this.chain);
  }

  getAllPlayers() {
    return getAllPlayers(this.chain);
  }

  getChat() {
    return getRecentChatMessages(this.chain);
  }

  getChatPlayer(player: string) {
    return getRecentPlayerMentions(this.chain, player);
  }

  getChatTeam(team: string) {
    return getRecentTeamMentions(this.chain, team);
  }

  async submitBlock(previousHash: string, player: string, team: string, nonce: number, providedHash: string, message?: string) {

    // verify the previous hash is correct
    const previousBlock = this.chain[this.chain.length - 1];
    if (previousHash !== previousBlock.hash) {
      throw new ValidationError({
        previousHash: [`Invalid previous hash: ${previousHash} !== ${previousBlock.hash}`]
      });
    }
    
    // verify the provided hash is correct
    const newBlockhash = calculateHash(
      previousBlock.hash,
      previousBlock.timestamp,
      player,
      team,
      nonce
    );
    if (providedHash !== newBlockhash) {
      throw new ValidationError({
        blockHash: [`Invalid block hash: ${providedHash} !== ${newBlockhash}`]
      });
    }

    // Verify the hash meets difficulty requirement
    if (!newBlockhash.startsWith(this.difficulty)) {
      throw new ValidationError({
        blockHash: [`Block does not meet difficulty requirement: ${newBlockhash} does not start with ${this.difficulty}`]
      });
    }

    // Create the new block
    const newBlock: Block = {
      index: this.chain.length,
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
    await this.appendBlock(newBlock);
    return this.getChainState();
  }

  async testMine(team: string, player: string, message?: string) {
    // Get the previous block
    const previousBlock = this.chain[this.chain.length - 1];

    // Mine a new block
    const newBlock = mineBlock(previousBlock, player, team, this.chain, message);

    // Append to chain
    await this.appendBlock(newBlock);
    return this.getChainState();
  }
}