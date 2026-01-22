import { readdir, writeFile, mkdir, appendFile, access } from "fs/promises";
import { createReadStream } from "fs";
import { createInterface } from "readline";
import { join } from "path";
import { Chain } from "../chain/chain";
import { Block } from "../block/block";
import { constants } from "fs";

export class Data {
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
            const block = JSON.parse(trimmed) as Block;
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

    let files: string[] = [];
    try {
      files = await readdir(this.dataDirectory);
    } catch (error) {
      throw new Error(
        `Failed to read data directory: ${this.dataDirectory}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    const chains: Map<string, Chain> = new Map();

    // Load all chains in parallel using Promise.all
    await Promise.all(
      files.map(async (file) => {
        let chain: Chain;
        try {
          chain = await this.loadChain(file);
        } catch (error) {
          throw new Error(
            `Failed to load chain for ${file}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }

        const verificationError = Chain.verifyChain(chain);
        if (verificationError) {
          throw new Error(
            `Chain verification failed for ${file}: ${verificationError}`,
          );
        }
        chains.set(file, chain);
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

    // Append each block as a JSON string on a new line
    for (const block of blocks) {
      try {
        const blockData: Block = {
          hash: block.hash,
          previousHash: block.previousHash,
          player: block.player,
          team: block.team,
          timestamp: block.timestamp,
          nonce: block.nonce,
          index: block.index,
          identity: block.identity,
        };

        await appendFile(filePath, JSON.stringify(blockData) + "\n", "utf-8");
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
