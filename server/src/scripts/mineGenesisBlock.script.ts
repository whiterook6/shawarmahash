import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import dotenv from "dotenv";
import { Block } from "../block/block";
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
    .help()
    .parse();

  const player = argv.player;
  const team = argv.team;
  const identityToken =
    argv.identity ?? IdentityController.generateIdentityToken();
  const derivedIdentity = IdentityController.generateDerivedIdentityToken({
    identityToken,
    secret: process.env.IDENTITY_SECRET,
  });

  console.log(
    `Generating genesis block for player "${player}"${team ? ` (team: ${team})` : ""}...`,
  );

  const genesisBlock = Block.createGenesisBlock({
    player,
    team,
    identity: derivedIdentity,
  });

  // Print the JSON
  console.log(JSON.stringify(genesisBlock, null, 2));
};

run()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
