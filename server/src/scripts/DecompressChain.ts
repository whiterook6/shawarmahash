import { loadChain } from "../Serialize";

const run = async () => {
  const chain = await loadChain();
  return JSON.stringify(chain, undefined, 2);
};

run().then(console.log).catch(console.error);
