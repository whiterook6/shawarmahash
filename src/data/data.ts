import { readdir, writeFile, mkdir, appendFile } from "fs/promises";
import { createReadStream } from "fs";
import { createInterface } from "readline";
import { join } from "path";
import { Chain } from "../chain/chain";
import { Block } from "../block/block";

export const Data = {
  loadChain: async (filePath: string): Promise<Chain> => {
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
  },

  loadAllChains: async (directoryName: string): Promise<Map<string, Chain>> => {
    let files: string[] = [];
    try {
      files = await readdir(directoryName);
    } catch (error) {
      throw new Error(
        `Failed to read data directory: ${directoryName}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    const chains: Map<string, Chain> = new Map();

    // Load all chains in parallel using Promise.all
    await Promise.all(
      files.map(async (file) => {
        const filePath = join(directoryName, file);
        let chain: Chain;
        try {
          chain = await Data.loadChain(filePath);
        } catch (error) {
          throw new Error(
            `Failed to load chain for ${file}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }

        const verificationError = Chain.verifyChain(chain);
        if (verificationError) {
          throw new Error(`Chain verification failed for ${file}: ${verificationError}`);
        }
        chains.set(file, chain);
      }),
    );

    return chains;
  },

  createChainFile: async (
    directoryName: string,
    player: string,
  ): Promise<void> => {
    const dataDir = join(directoryName, "data");
    const filePath = join(dataDir, player);

    // Ensure data directory exists
    try {
      await mkdir(dataDir, { recursive: true });
    } catch (error) {
      throw new Error(
        `Failed to create data directory: ${dataDir}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // Create empty file
    try {
      await writeFile(filePath, "", "utf-8");
    } catch (error) {
      throw new Error(
        `Failed to create chain file: ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },

  appendBlocks: async (player: string, blocks: Block[]): Promise<void> => {
    const dataDir = join(process.cwd(), "data");
    const filePath = join(dataDir, player);

    // Ensure data directory exists
    try {
      await mkdir(dataDir, { recursive: true });
    } catch (error) {
      throw new Error(
        `Failed to create data directory: ${dataDir}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // Append each block as a JSON string on a new line
    for (const block of blocks) {
      try {
        const blockData: Block = {
          hash: block.hash,
          previousHash: block.previousHash,
          timestamp: block.timestamp,
          nonce: block.nonce,
          index: block.index,
          player: block.player,
        };
        if (block.team) {
          blockData.team = block.team;
        }
        if (block.message) {
          blockData.message = block.message;
        }
        await appendFile(filePath, JSON.stringify(blockData) + "\n", "utf-8");
      } catch (error) {
        throw new Error(
          `Failed to append blocks to chain file: ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  },
};
