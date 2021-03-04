import digest from "sha.js";

interface Block {
  previousHash: number;
  nonce: number;
  hash: number;
}

type Chain = Block[];

const chain: Chain = [];

const hash = (currentHash: number, nonce: number): string => {
  return digest("sha1").update(`${currentHash.toString(16)}${nonce.toString(16)}`).digest("hex");
}

const build = (current: Block, nonce: number): Block => {
  return {
    previousHash: current.hash,
    nonce,
    hash: parseInt(hash(current.hash, nonce), 16)
  };
}

const verifyBlock = (block: Block): boolean => {
  return hash(block.previousHash, block.nonce) === block.hash.toString(16) && block.hash.toString(16).startsWith("0");
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

const churn = (): Block => {
  let previousHash: number;
  if (chain.length === 0){
    previousHash = 0;
  } else {
    previousHash = chain[chain.length - 1].hash;
  }

  let nonce: number = Math.floor(Math.random() * 10000);
  let hashcode: string = hash(previousHash, nonce);
  while (!hashcode.startsWith("0")){
    nonce++;
    hashcode = hash(previousHash, nonce);
    console.log(hashcode);
  }

  return {
    hash: parseInt(hashcode, 16),
    nonce,
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
  chain[index].nonce = parseInt(`0${chain[index].nonce}`, 16);
  verifyChain(chain);
};

run();