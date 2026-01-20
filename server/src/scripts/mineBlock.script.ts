import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import dotenv from "dotenv";
import { Block } from "../block/block";
import { Difficulty } from "../difficulty/difficulty";
import { Timestamp } from "../timestamp/timestamp";
import { IdentityController } from "../identity/identity.controller";

const run = async () => {
  dotenv.config();
  if (!process.env.IDENTITY_SECRET) {
    throw new Error("IDENTITY_SECRET is not set");
  }

  // Parse command line arguments
  const argv = await yargs(hideBin(process.argv))
    .scriptName("generateBlock")
    .usage("$0 [options]")
    .option("previousHash", {
      alias: "h",
      type: "string",
      demandOption: true,
      describe: "Hexadecimal hash string",
    })
    .option("previousTimestamp", {
      alias: "s",
      type: "number",
      demandOption: true,
      describe: "Unix timestamp in seconds",
    })
    .option("difficultyTarget", {
      alias: "d",
      type: "string",
      demandOption: true,
      describe: "Hexadecimal difficulty target (32 chars)",
    })
    .option("player", {
      alias: "p",
      type: "string",
      demandOption: true,
      describe: "Three uppercase letters (e.g., ABC)",
    })
    .option("identity", {
      alias: "i",
      type: "string",
      demandOption: false,
      describe: "Raw identity token (will be derived before storing on blocks)",
    })
    .option("team", {
      alias: "t",
      type: "string",
      demandOption: true,
      describe: "Three uppercase letters (e.g., ABC)",
    })
    .option("index", {
      alias: "x",
      type: "number",
      default: 0,
      describe: "Block index (default: 0)",
    })
    .check((argv) => {
      if (argv.difficultyTarget.length !== 32) {
        throw new Error("difficultyTarget must be 32 characters long");
      }
      return true;
    })
    .help()
    .parse();

  const player = argv.player;
  const previousHash = argv.previousHash;
  const previousTimestamp = argv.previousTimestamp;
  const difficultyTarget = argv.difficultyTarget;
  const team = argv.team;
  const index = argv.index;
  const identityToken =
    argv.identity ?? IdentityController.generateIdentityToken();
  const derivedIdentity = IdentityController.generateDerivedIdentityToken({
    identityToken,
    secret: process.env.IDENTITY_SECRET,
  });

  console.error(
    `Mining block for player "${player}" with difficulty target "${difficultyTarget}"...`,
  );

  // Mine the block
  let nonce = 0;
  let hash = "";
  while (true) {
    hash = Block.calculateHash({
      previousHash,
      previousTimestamp,
      player,
      team,
      nonce,
    });
    if (Difficulty.isDifficultyMet(hash, difficultyTarget)) {
      break;
    }
    nonce++;
  }

  // Create the block
  const block: Block = {
    index: index,
    hash: hash,
    previousHash: previousHash,
    player: player,
    team: team,
    timestamp: Timestamp.now(),
    nonce: nonce,
    identity: derivedIdentity,
  };

  // Print the JSON
  console.log(JSON.stringify(block, null, 2));
};

run()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
