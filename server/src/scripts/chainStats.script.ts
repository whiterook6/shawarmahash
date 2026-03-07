import dotenv from "dotenv";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { join, isAbsolute } from "path";

dotenv.config();
import { Data } from "../data/data";
import { Chain } from "../chain/chain";
import { Difficulty } from "../difficulty/difficulty";
import { DatabaseController } from "../database/database.controller";

function getDatabasePath(): string {
  const raw = process.env.DATABASE_PATH ?? "data/database.sqlite";
  return isAbsolute(raw) ? raw : join(process.cwd(), raw);
}

const run = async () => {
  // Parse command line arguments
  const argv = await yargs(hideBin(process.argv))
    .scriptName("chainStats")
    .usage("$0 [options]")
    .option("team", {
      alias: "t",
      type: "string",
      demandOption: true,
      describe: "Team name",
    })
    .help()
    .parse();

  const team = argv.team;

  const databasePath = getDatabasePath();
  const migrationsPath = join(process.cwd(), "src", "database", "migrations");
  const database = new DatabaseController(databasePath);
  database.createMigrationsTable();
  await database.runMigrations(migrationsPath);
  const data = new Data(database);

  // Load chain from file
  let chain: Chain;
  try {
    chain = data.loadChain(team);
  } catch (error) {
    console.error(
      `Error loading chain file: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
  database.close();

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
  console.log(`Chain Statistics for "${team}":`);
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
