import digest from "sha.js";

interface Block {
  previousHash: string | "0";
  nonce: string;
  hash: string;
}

type Chain = Block[];

const chain: Chain = [];

const hash = (currentHash: string, nonce: string): string => {
  return digest("sha1").update(`${currentHash}${nonce}`).digest("hex");
}

const build = (current: Block, nonce: string): Block => {
  return {
    previousHash: current.hash,
    nonce,
    hash: hash(current.hash, nonce)
  };
}

const verifyBlock = (block: Block): boolean => {
  return hash(block.previousHash, block.nonce) === block.hash;
}

const verifyChain = (chain: Chain) => {
  if (chain.length === 0){
    return;
  }

  let block = chain[0];
  if (!verifyBlock(block)){
    throw new Error(`Block 0 hash is invalid: expected ${block.hash}, got ${hash(block.previousHash, block.nonce)}.`);
  }
  for (let index = 1; index < chain.length; index++) {
    const previousBlock = block;
    block = chain[index];
    if (block.previousHash !== previousBlock.hash){
      throw new Error(`Block ${index} has an invalid previous hash: expected ${previousBlock.hash}, got ${block.previousHash}`);
    }
    if (!verifyBlock(block)){
      throw new Error(`Block ${index} hash is invalid: expected ${block.hash}, got ${hash(block.previousHash, block.nonce)}.`);
    }
  }
}

const churn = () => {
  let previousHash;
  if (chain.length === 0){
    previousHash = "0";
  } else {
    previousHash = chain[chain.length - 1].hash;
  }

  let nonce = Math.floor(Math.random() * 10000);
  let hashcode = hash(previousHash, nonce.toString(10));
  while (!hashcode.startsWith("0000")){
    nonce++;
    hashcode = hash(previousHash, nonce.toString(10));
  }

  return {
    hash: hashcode,
    nonce: nonce.toString(10),
    previousHash
  };
}

const run = () => {
  while (chain.length < 50){
    const block = churn();
    console.log("Block found!")
    console.log(JSON.stringify(block));
    console.log(`Current height: ${chain.length}`);
    chain.push(block);
  }

  console.log("smudging random block");
  const index = Math.floor(Math.random() * chain.length);
  chain[index].nonce = `0${chain[index].nonce}`;
  verifyChain(chain);
};

run();