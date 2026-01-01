import { readdir, writeFile, mkdir, appendFile } from "fs/promises";
import { createReadStream } from "fs";
import { createInterface } from "readline";
import { join } from "path";
import { Chain } from "./chain";
import { Block } from "./block";

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
            reject(new Error(`Failed to parse line in file: ${filePath}`));
          }
        }
      });
  
      rl.on("close", () => {
        resolve(chain);
      });
  
      rl.on("error", (error) => {
        reject(new Error(`Failed to read file: ${filePath} - ${error.message}`));
      });
  
      fileStream.on("error", (error) => {
        reject(new Error(`Failed to open file: ${filePath} - ${error.message}`));
      });
    });
  },

  loadAllChains: async (directoryName: string): Promise<Map<string, Chain>> => {
    let files: string[] = [];
    try {
      files = await readdir(directoryName);
    } catch (error) {
      throw new Error(`Failed to read data directory: ${directoryName}`);
    }

    const chains: Map<string, Chain> = new Map();

    // Load all chains in parallel using Promise.all
    await Promise.all(files.map(async (file) => {
      const filePath = join(directoryName, file);
      try {
        const chain = await Data.loadChain(filePath);
        chains.set(file, chain);
      } catch (error) {
        throw new Error(`Failed to load chain for ${file}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }));

    return chains;
  },

  createChainFile: async (directoryName: string, player: string): Promise<void> => {
    const dataDir = join(directoryName, "data");
    const filePath = join(dataDir, player);

    // Create genesis block
    const genesisBlock: Block = Block.createGenesisBlock(player);
    const chain: Chain = [genesisBlock];

    // Ensure data directory exists
    try {
      await mkdir(dataDir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create data directory: ${dataDir}`);
    }

    // Write chain to file (one block per line)
    try {
      const content = chain.map((block) => JSON.stringify(block)).join("\n");
      await writeFile(filePath, content, "utf-8");
    } catch (error) {
      throw new Error(`Failed to write chain file: ${filePath}`);
    }
  },

  appendBlocks: async (player: string, blocks: Block[]): Promise<void> => {
    const dataDir = join(process.cwd(), "data");
    const filePath = join(dataDir, player);

    // Ensure data directory exists
    try {
      await mkdir(dataDir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create data directory: ${dataDir}`);
    }

    // Append each block as a JSON string on a new line
    for (const block of blocks) {
      try {
        await appendFile(filePath, JSON.stringify(block) + "\n", "utf-8");
      } catch (error) {
        throw new Error(`Failed to append blocks to chain file: ${filePath}`);
      }
    }
  },
};