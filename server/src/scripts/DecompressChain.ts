import { getBlockDifficultyHash } from "../Block";
import { loadChain } from "../Serialize";

const run = async () => {
  const chain = await loadChain();
  if (chain.length === 0) {
    console.log("empty chain");
    return;
  }

  chain.forEach((block) => {
    console.log(
      JSON.stringify(
        {
          timestamp: new Date(block.timestamp * 1000),
          id: block.team
            ? `@${block.player}#${block.team}`
            : `@${block.player}`,
          nonce: block.nonce,
          difficultyHash: getBlockDifficultyHash(
            block.previousHash,
            block.nonce
          ),
          hashCode: block.hashCode,
        },
        undefined,
        2
      )
    );
  });
  const totalTime = Math.round(
    chain[chain.length - 1].timestamp - chain[0].timestamp
  );
  console.log(
    `Statistics:\nHeight: ${chain.length}\nTotal Time: ${totalTime}s`
  );
};

run()
  .then(() => process.exit(0))
  .catch(console.error);
