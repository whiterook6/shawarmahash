import { loadChain } from "../Serialize";

const run = async () => {
  const chain = await loadChain();
  console.log(JSON.stringify(chain, undefined, 2));
};

run()
  .then(() => process.exit(0))
  .catch(console.error);
