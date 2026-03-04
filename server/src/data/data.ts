import { Block } from "../block/block";
import { Chain } from "../chain/chain";
import { DatabaseController } from "../database/database.controller";

export class Data {
  constructor(private database: DatabaseController) {}

  private mapBlock(row: Record<string, unknown>): Block {
    return {
      hash: row.hash,
      previousHash: row.previousHash,
      index: row.index,
      player: row.player,
      team: row.team,
      identity: row.identity,
      timestamp: row.timestamp,
      nonce: row.nonce,
      data: typeof row.data === "string" ? JSON.parse(row.data) : undefined,
    } as Block;
  }

  loadChain(team: string): Chain {
    const chain = this.database
      .prepare(
        `
SELECT
  hash,
  previous_hash as previousHash,
  "index",
  player,
  team,
  identity,
  timestamp,
  nonce,
  data
FROM blocks
WHERE team = :team
ORDER BY "index" ASC`,
      )
      .all({
        team,
      })
      .map((row) => this.mapBlock(row));

    const verificationError = Chain.verifyChain(chain);
    if (verificationError) {
      throw new Error(
        `Chain verification failed for ${team}: ${verificationError}`,
      );
    }

    return chain;
  }

  loadAllChains(): Map<string, Chain> {
    const blocks = this.database
      .prepare(
        `SELECT
      hash,
      previous_hash as previousHash,
      "index",
      player,
      team,
      identity,
      timestamp,
      nonce,
      data
    FROM blocks
    ORDER BY "index" ASC`,
      )
      .all()
      .map((row) => this.mapBlock(row));

    const chains = blocks.reduce((acc: Map<string, Chain>, block: Block) => {
      if (!acc.has(block.team)) {
        acc.set(block.team, []);
      }

      acc.get(block.team)!.push(block);
      return acc;
    }, new Map<string, Chain>());

    for (const [team, chain] of chains.entries()) {
      const verificationError = Chain.verifyChain(chain);
      if (verificationError) {
        throw new Error(
          `Chain verification failed for ${team}: ${verificationError}`,
        );
      }
    }

    return chains;
  }

  appendBlocks(blocks: Block[]): void {
    const statement = this.database.prepare(`INSERT INTO blocks (
      hash,
      previous_hash,
      "index",
      player,
      team,
      identity,
      timestamp,
      nonce,
      data
    ) VALUES (
      :hash,
      :previousHash,
      :index,
      :player,
      :team,
      :identity,
      :timestamp,
      :nonce,
      :data
    )`);
    for (const block of blocks) {
      statement.run({
        hash: block.hash,
        previousHash: block.previousHash,
        index: block.index,
        player: block.player,
        team: block.team,
        identity: block.identity,
        timestamp: block.timestamp,
        nonce: block.nonce,
        data: JSON.stringify(block.data ?? {}),
      });
    }
  }
}
