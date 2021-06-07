import { getBlockDifficultyHash } from "../Block";
import { loadChain } from "../Serialize";

const run = async () => {
  const chain = await loadChain();
  if (chain.length === 0) {
    console.log("empty chain");
    return;
  }

  chain.forEach((block) => {
    console.log(block.hashCode);
  });
};

run()
  .then(() => process.exit(0))
  .catch(console.error);
