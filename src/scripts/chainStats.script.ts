import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { join } from "path";
import { Data } from "../data/data";
import { Chain } from "../chain/chain";
import { Difficulty } from "../difficulty/difficulty";

const run = async () => {
  // Parse command line arguments
  const argv = await yargs(hideBin(process.argv))
    .scriptName("chainStats")
    .usage("$0 [options]")
    .option("playerName", {
      alias: "p",
      type: "string",
      demandOption: true,
      describe: "Player name",
    })
    .help()
    .parse();

  const playerName = argv.playerName;

  // Construct file path
  const dataDir = join(process.cwd(), "data");
  const filePath = join(dataDir, playerName);

  // Load chain from file
  let chain: Chain;
  try {
    chain = await Data.loadChain(filePath);
  } catch (error) {
    console.error(
      `Error loading chain file: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }

  // Verify chain
  const verificationError = Chain.verifyChain(chain);
  if (verificationError) {
    console.error(`Error: Chain verification failed: ${verificationError}`);
    process.exit(1);
  }

  // Calculate statistics
  const chainLength = chain.length;
  const currentDifficultyTarget =
    Difficulty.getDifficultyTargetFromChain(chain);
  const currentDifficulty = Difficulty.getDifficultyFromHash(
    currentDifficultyTarget,
  );
  const averageDifficulty = Difficulty.getAverageDifficulty(chain);

  // Calculate total mining time (timestamps are in seconds)
  let totalMiningTimeSeconds = 0;
  if (chain.length > 1) {
    totalMiningTimeSeconds =
      chain[chain.length - 1].timestamp - chain[0].timestamp;
  }

  // Calculate average mining interval (returns seconds)
  const averageMiningIntervalSeconds = Chain.getAverageMiningInterval(chain);

  // Display statistics
  console.log(`Chain Statistics for "${playerName}":`);
  console.log(`  Chain Length: ${chainLength} blocks`);
  console.log(`  Current Difficulty: ${currentDifficulty.toFixed(2)}`);
  console.log(`  Current Difficulty Target: ${currentDifficultyTarget}`);
  console.log(`  Average Difficulty: ${averageDifficulty.toFixed(2)}`);
  console.log(
    `  Total Mining Time: ${totalMiningTimeSeconds.toFixed(2)} seconds (${(totalMiningTimeSeconds / 60).toFixed(2)} minutes)`,
  );
  console.log(
    `  Average Mining Interval: ${averageMiningIntervalSeconds.toFixed(2)} seconds per block`,
  );

  // Additional info
  if (chain.length > 0) {
    const genesisBlock = chain[0];
    const lastBlock = chain[chain.length - 1];
    console.log(`  Genesis Block Hash: ${genesisBlock.hash}`);
    console.log(`  Last Block Hash: ${lastBlock.hash}`);
    console.log(
      `  Genesis Timestamp: ${new Date(genesisBlock.timestamp * 1000).toISOString()}`,
    );
    console.log(
      `  Last Block Timestamp: ${new Date(lastBlock.timestamp * 1000).toISOString()}`,
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
