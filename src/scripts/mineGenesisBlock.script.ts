import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { Block } from "../block/block";

const run = async () => {
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
    .option("team", {
      alias: "T",
      type: "string",
      describe: "Optional three uppercase letters",
    })
    .help()
    .parse();

  const player = argv.player;
  const team = argv.team;

  console.log(
    `Generating genesis block for player "${player}"${team ? ` (team: ${team})` : ""}...`,
  );

  const genesisBlock = Block.createGenesisBlock(player, team);

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
