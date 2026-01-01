import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { Block } from "../block";
import { Chain } from "../chain";
import { Miner } from "../miner";

const run = async () => {
  // Parse command line arguments
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error(
      "Usage: node generateChain.script.ts <playerName> <numBlocks> [team]",
    );
    process.exit(1);
  }

  const playerName = args[0];
  const numBlocksStr = args[1];
  const team = args[2]; // Optional

  const numBlocks = parseInt(numBlocksStr, 10);
  if (isNaN(numBlocks) || numBlocks < 1) {
    console.error("Error: numBlocks must be a positive integer");
    process.exit(1);
  }

  console.log(
    `Generating chain for player "${playerName}" with ${numBlocks} blocks${team ? ` (team: ${team})` : ""}...`,
  );

  // Create genesis block
  const genesisBlock = Block.createGenesisBlock(playerName);
  const chain: Chain = [genesisBlock];

  console.log(`Created genesis block (hash: ${genesisBlock.hash})`);

  // Mine remaining blocks
  for (let i = 1; i < numBlocks; i++) {
    const newBlock = Miner.mineBlock(playerName, team, chain);
    chain.push(newBlock);
    console.log(`Mined block ${i + 1}/${numBlocks} (hash: ${newBlock.hash})`);
  }

  // verify the chain
  if (!Chain.verifyChain(chain)) {
    throw new Error("Chain verification failed");
  }

  // Write chain to file
  const dataDir = join(process.cwd(), "data");
  const filePath = join(dataDir, playerName);

  // Ensure data directory exists
  try {
    await mkdir(dataDir, { recursive: true });
  } catch (error) {
    throw new Error(
      `Failed to create data directory: ${dataDir}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // Write each block as a JSON string on a new line
  const chainContent =
    chain.map((block) => JSON.stringify(block)).join("\n") + "\n";

  try {
    await writeFile(filePath, chainContent, "utf-8");
    console.log(`Successfully wrote chain to ${filePath}`);
  } catch (error) {
    throw new Error(
      `Failed to write chain file: ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

run()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
