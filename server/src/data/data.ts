import { readdir, writeFile, mkdir, appendFile, access } from "fs/promises";
import { createReadStream } from "fs";
import { createInterface } from "readline";
import { join } from "path";
import { Chain } from "../chain/chain";
import { Block } from "../block/block";
import { constants } from "fs";

export class Data {
  static removeLeadingFs(hash: string): string {
    return hash.replace(/^F+/i, "");
  }

  static stringify(block: Block): string {
    // Remove leading Fs from hash and previousHash
    const hash = Data.removeLeadingFs(block.hash);
    const previousHash = Data.removeLeadingFs(block.previousHash);
    const start = `${hash}:${previousHash}:${block.player}:${block.team}:${block.timestamp}:${block.nonce.toString(16)}:${block.identity}:${block.index}`;
    if (block.data && Object.keys(block.data).length > 0) {
      return `${start}:${JSON.stringify(block.data)}`;
    } else {
      return start;
    }
  }

  static padWithFs(hash: string): string {
    return hash.padStart(32, "f");
  }

  static findJsonStart(line: string): number {
    let colonIndex = -1;
    for (let i = 0; i < 8; i++) {
      colonIndex = line.indexOf(":", colonIndex + 1);
      if (colonIndex === -1) return -1;
    }
    return colonIndex;
  }

  static parse(line: string): Block {
    const parts = line.trim().split(":", 8);
    if (parts.length !== 8) {
      throw new Error(
        `Invalid block format: expected 8 parts separated by ':', got ${parts.length}`,
      );
    }

    // Left pad hash and previousHash with Fs until 32 characters
    const hash = Data.padWithFs(parts[0]);
    const previousHash = Data.padWithFs(parts[1]);
    const player = parts[2];
    const team = parts[3];
    const timestamp = parseInt(parts[4], 10);
    const nonce = parseInt(parts[5], 16);
    const identity = parts[6];
    const index = parseInt(parts[7], 10);

    if (isNaN(timestamp) || isNaN(nonce) || isNaN(index)) {
      throw new Error(
        `Invalid block format: timestamp, nonce, or index is not a valid number`,
      );
    }

    let data: Record<string, unknown> = {};
    const jsonStart = Data.findJsonStart(line);
    if (jsonStart !== -1) {
      const json = line.slice(jsonStart + 1);
      try {
        const parsed = JSON.parse(json);
        // Add this validation check:
        if (
          typeof parsed !== "object" ||
          parsed === null ||
          Array.isArray(parsed)
        ) {
          throw new Error("Data must be a JSON object");
        }
        data = parsed;
      } catch (error) {
        throw new Error(
          `Invalid block format: data part is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return {
      hash,
      previousHash,
      player,
      team,
      timestamp,
      nonce,
      identity,
      index,
      data: data || {},
    };
  }

  private dataDirectory: string;

  constructor(dataDirectory: string) {
    this.dataDirectory = dataDirectory;
  }

  async ensureDataDirectoryExists(): Promise<void> {
    try {
      await mkdir(this.dataDirectory, { recursive: true });
    } catch (error) {
      throw new Error(
        `Failed to create data directory: ${this.dataDirectory}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async loadChain(filename: string): Promise<Chain> {
    const filePath = join(this.dataDirectory, filename);
    return new Promise((resolve, reject) => {
      const chain: Chain = [];
      const fileStream = createReadStream(filePath, { encoding: "utf-8" });
      const rl = createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      rl.on("line", (line) => {
        const trimmed = line.trim();
        if (trimmed !== "") {
          try {
            const block = Data.parse(trimmed);
            chain.push(block);
          } catch (error) {
            rl.close();
            fileStream.close();
            reject(
              new Error(
                `Failed to parse line in file: ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
              ),
            );
          }
        }
      });

      rl.on("close", () => {
        resolve(chain);
      });

      rl.on("error", (error) => {
        reject(
          new Error(`Failed to read file: ${filePath} - ${error.message}`),
        );
      });

      fileStream.on("error", (error) => {
        reject(
          new Error(`Failed to open file: ${filePath} - ${error.message}`),
        );
      });
    });
  }

  async loadAllChains(): Promise<Map<string, Chain>> {
    await this.ensureDataDirectoryExists();

    let filenames: string[] = [];
    try {
      filenames = await readdir(this.dataDirectory);
    } catch (error) {
      throw new Error(
        `Failed to read data directory: ${this.dataDirectory}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    const chains: Map<string, Chain> = new Map();

    // Load all chains in parallel using Promise.all
    await Promise.all(
      filenames.map(async (filename) => {
        let chain: Chain;
        try {
          chain = await this.loadChain(filename);
        } catch (error) {
          throw new Error(
            `Failed to load chain for ${filename}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }

        if (chain.length > 0) {
          const verificationError = Chain.verifyChain(chain);
          if (verificationError) {
            throw new Error(
              `Chain verification failed for ${filename}: ${verificationError}`,
            );
          }
          chains.set(filename, chain);
        }
      }),
    );

    return chains;
  }

  async createChainFile(team: string): Promise<void> {
    const filePath = join(this.dataDirectory, team);

    // Ensure data directory exists
    await this.ensureDataDirectoryExists();

    // Create empty file
    try {
      await writeFile(filePath, "", {
        encoding: "utf-8",
        flag: "w",
      });
    } catch (error) {
      throw new Error(
        `Failed to create chain file: ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async appendBlocks(team: string, blocks: Block[]): Promise<void> {
    const filePath = join(this.dataDirectory, team);

    // Ensure data directory exists
    await this.ensureDataDirectoryExists();

    // Append each block using stringify on a new line
    for (const block of blocks) {
      try {
        await appendFile(filePath, Data.stringify(block) + "\n", "utf-8");
      } catch (error) {
        throw new Error(
          `Failed to append blocks to chain file: ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  async getDirectoryStatus(): Promise<{
    exists: boolean;
    readable: boolean;
    writable: boolean;
  }> {
    const [exists, readable, writable] = await Promise.all([
      new Promise<boolean>((resolve) => {
        access(this.dataDirectory, constants.F_OK)
          .then(() => resolve(true))
          .catch(() => resolve(false));
      }),
      new Promise<boolean>((resolve) => {
        access(this.dataDirectory, constants.R_OK)
          .then(() => resolve(true))
          .catch(() => resolve(false));
      }),
      new Promise<boolean>((resolve) => {
        access(this.dataDirectory, constants.W_OK)
          .then(() => resolve(true))
          .catch(() => resolve(false));
      }),
    ]);

    return { exists, readable, writable };
  }
}
