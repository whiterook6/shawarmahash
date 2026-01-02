import { Block } from "../block";
import { Difficulty } from "../difficulty";

const run = async () => {
  // Parse command line arguments
  const args = process.argv.slice(2);

  if (args.length < 4) {
    console.error(
      "Usage: node generateBlock.script.ts <player> <previousHash> <previousTimestamp> <difficultyTarget> [team] [index]",
    );
    console.error("  player: Three uppercase letters (e.g., ABC)");
    console.error("  previousHash: Hexadecimal hash string");
    console.error("  previousTimestamp: Unix timestamp in milliseconds");
    console.error("  difficultyTarget: Hexadecimal difficulty target (64 chars)");
    console.error("  team: Optional three uppercase letters");
    console.error("  index: Optional block index (default: 0)");
    process.exit(1);
  }

  const player = args[0];
  const previousHash = args[1];
  const previousTimestamp = parseInt(args[2], 10);
  const difficultyTarget = args[3];
  const team = args[4]; // Optional
  const index = args[5] ? parseInt(args[5], 10) : 0;

  // Validate inputs
  if (isNaN(previousTimestamp)) {
    console.error("Error: previousTimestamp must be a valid number");
    process.exit(1);
  }

  if (isNaN(index)) {
    console.error("Error: index must be a valid number");
    process.exit(1);
  }

  if (difficultyTarget.length !== 64) {
    console.error("Error: difficultyTarget must be 64 characters long");
    process.exit(1);
  }

  console.error(
    `Mining block for player "${player}" with difficulty target "${difficultyTarget}"...`,
  );

  // Mine the block
  let nonce = 0;
  let hash = "";
  while (true) {
    hash = Block.calculateHash(
      previousHash,
      previousTimestamp,
      player,
      team,
      nonce,
    );
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
    timestamp: Date.now(),
    nonce: nonce,
  };

  if (team) {
    block.team = team;
  }

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

