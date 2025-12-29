import { Chain } from "./chain"
import { gzip, gunzip } from "zlib";
import { writeFile, readFile, mkdir } from "fs/promises";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data");

export const getDataFilePath = async (filename: string): Promise<string> => {
  await mkdir(DATA_DIR, { recursive: true });
  return join(DATA_DIR, filename);
}

export const saveChain = async (chain: Chain, filepath: string): Promise<void> => {
  const json = JSON.stringify(chain);
  const buffer = Buffer.from(json, "utf-8");
  const compressed = await new Promise<Buffer>((resolve, reject) => {
    gzip(buffer, (err, result) => {
      if (err) {
        reject(err);
      }
      resolve(result);
    });
  });
  await writeFile(filepath, compressed);
}

export const loadChain = async (filepath: string): Promise<Chain> => {
  const compressed = await readFile(filepath);
  const decompressed = await new Promise<Buffer>((resolve, reject) => {
    gunzip(compressed, (err, result) => {
      if (err) {
        reject(err);
      }
      resolve(result);
    });
  });
  const json = decompressed.toString("utf-8");
  return JSON.parse(json) as Chain;
}