import { getPlayerScores, getTeamScores } from "../Scoreboard";
import { loadChain } from "../Serialize";

const run = async () => {
  const chain = await loadChain();
  const teamScores = getTeamScores(chain);
  const playerScores = getPlayerScores(chain);
  console.log(`Total: ${chain.length} blocks`);
  console.log("Team Scores:", ...teamScores.entries());
  console.log("Player Scores:", ...playerScores.entries());
};

run()
  .then(() => process.exit(0))
  .catch(console.error);
