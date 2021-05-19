import LZUTF8 from "lzutf8";
import mkdirp from "mkdirp";
import path from "path";
import fs from "fs/promises";
import { Chain } from "./Chain";

const dataDirPath = path.join(__dirname, "..", "data");
const dataFilePath = path.join(__dirname, "..", "data", "chain");

export const makeDataDir = async () => {
  await mkdirp(dataDirPath);
};

export const saveChain = async (chain: Chain) => {
  const json = JSON.stringify(chain);
  console.time("Compressing");
  const compressed = await new Promise<string>((resolve, reject) => {
    LZUTF8.compressAsync(
      json,
      {
        useWebWorker: false,
        outputEncoding: "BinaryString",
      },
      (result, error) => {
        if (error) {
          reject(error);
        } else {
          resolve(result as string);
        }
      }
    );
  });
  console.timeEnd("Compressing");
  await fs.writeFile(dataFilePath, compressed, { flag: "w" });
};

export const loadChain = async (): Promise<Chain> => {
  let compressed: Buffer;
  try {
    compressed = await fs.readFile(dataFilePath, {
      flag: "r",
    });
  } catch (error) {
    console.error(new Error("Cannot load chain file"));
    return [] as Chain;
  }

  let decompressed;
  try {
    console.time("Decompressing");
    decompressed = await new Promise<string>((resolve, reject) => {
      LZUTF8.decompressAsync(
        compressed.toString(),
        {
          useWebWorker: false,
          inputEncoding: "BinaryString",
        },
        (result, error) => {
          if (error) {
            reject(error);
          } else {
            resolve(result as string);
          }
        }
      );
    });
    console.timeEnd("Decompressing");
  } catch (error) {
    console.error(error);
    return [];
  }

  let parsed: any;
  try {
    parsed = JSON.parse(decompressed.toString());
  } catch (error) {
    console.error(error);
    return [];
  }

  return parsed as Chain;
};
