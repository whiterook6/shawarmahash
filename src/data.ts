import { Chain } from "./chain"
import { writeFile, appendFile, mkdir } from "fs/promises";
import { createReadStream } from "fs";
import { createInterface } from "readline";
import { join } from "path";
import { Block } from "./block";

const DATA_DIR = join(process.cwd(), "data");

export const getDataFilePath = async (filename: string): Promise<string> => {
  await mkdir(DATA_DIR, { recursive: true });
  return join(DATA_DIR, filename);
}

export const saveChain = async (chain: Chain, filepath: string): Promise<void> => {
  const lines = chain.map(block => JSON.stringify(block));
  const content = lines.join("\n") + "\n";
  await writeFile(filepath, content, "utf-8");
}

export const appendBlockToChain = async (block: Block, filepath: string): Promise<void> => {
  const line = JSON.stringify(block) + "\n";
  await appendFile(filepath, line, "utf-8");
}

export const loadChain = async (filepath: string): Promise<Chain> => {
  const fileStream = createReadStream(filepath, { encoding: "utf-8" });
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity, // Handle Windows line endings
  });

  const chain: Chain = [];
  for await (const line of rl) {
    const trimmed = line.trim();
    if (trimmed) {
      chain.push(JSON.parse(trimmed) as Block);
    }
  }

  return chain;
}