import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { Block } from "../block/block";
import { Chain } from "../chain/chain";
import { Miner } from "../miner/miner";
import { faker } from "@faker-js/faker";

const run = async () => {
  // Parse command line arguments
  const argv = await yargs(hideBin(process.argv))
    .scriptName("generateChain")
    .usage("$0 [options]")
    .option("team", {
      alias: "t",
      type: "string",
      demandOption: true,
      describe: "Team name",
    })
    .option("numBlocks", {
      alias: "n",
      type: "number",
      demandOption: true,
      describe: "Number of blocks to generate",
    })
    .option("player", {
      alias: "p",
      type: "string",
      demandOption: true,
      describe: "Player name",
    })
    .option("message", {
      alias: "m",
      type: "boolean",
      default: false,
      describe: "Generate messages in each block",
    })
    .check((argv) => {
      if (argv.numBlocks < 1 || !Number.isInteger(argv.numBlocks)) {
        throw new Error("numBlocks must be a positive integer");
      }
      return true;
    })
    .help()
    .parse();

  const player = argv.player;
  const team = argv.team;
  const numBlocks = argv.numBlocks;

  console.log(
    `Generating chain for player "${player}" in team "${team}" with ${numBlocks} blocks...`,
  );

  // Create genesis block
  const genesisBlock = Block.createGenesisBlock({
    player,
    team,
  });
  const chain: Chain = [genesisBlock];

  console.log(`Created genesis block (hash: ${genesisBlock.hash})`);

  // Mine remaining blocks
  for (let i = 1; i < numBlocks; i++) {
    const message = argv.message ? faker.lorem.sentence() : undefined;
    const newBlock = Miner.mineBlock(chain, {
      player,
      team,
      message,
    });
    chain.push(newBlock);
    console.log(`Mined block ${i + 1}/${numBlocks} (hash: ${newBlock.hash})`);
  }

  // verify the chain
  const verificationError = Chain.verifyChain(chain);
  if (verificationError) {
    throw new Error(`Chain verification failed: ${verificationError}`);
  }

  // Write chain to file
  const dataDir = join(process.cwd(), "data");
  const filePath = join(dataDir, team);

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
