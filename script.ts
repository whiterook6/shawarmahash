import digest from "sha.js";

interface Block {
  previousHash: string;
  nonce: string;
  hashCode: string;
}

type Chain = Block[];
type Nonces = string[];

const difficulty = "00000";

const hash = (currentHash: string, nonce: string): string => {
  return digest("sha1").update(`${currentHash}${nonce}`).digest("hex");
}

const compress = (chain: Chain): Nonces => {
  if (chain.length === 0){
    return [];
  }

  try {
    verifyChain(chain);
  } catch (error){
    throw new Error(`Error compressing chain: ${error.message}`);
  }
  return chain.map(block => block.nonce);
}

const decompress = (nonces: Nonces): Chain => {
  if (nonces.length === 0){
    return [];
  }

  let previousHash = "0";
  const chain: Chain = nonces.map(nonce => {
    const hashCode = hash(previousHash, nonce);
    const block: Block = {
      previousHash,
      nonce,
      hashCode
    };
    
    previousHash = hashCode;
    return block;
  });

  try {
    verifyChain(chain);
  } catch (error){
    throw new Error(`Error decompressing chain: ${error.message}`);
  }
  return chain;
}

const verifyBlock = (block: Block): void => {
  const hashcode = hash(block.previousHash, block.nonce);
  if (!block.hashCode.startsWith(difficulty)){
    throw new Error(`Hashcode target difficulty missed. Expected ${difficulty}, got ${block.hashCode.substr(0, difficulty.length)}`);
  }
  if (hashcode !== block.hashCode){
    throw new Error(`Hashcode Mismatch: Expected ${block.hashCode}, got ${hashcode}.`);
  }
}

const verifyChain = (chain: Chain) => {
  if (chain.length === 0){
    return;
  }

  let block = chain[0];
  try {
    verifyBlock(block);
  } catch (error){
    throw new Error(`Block 0 hash is invalid: ${error.message}`);
  }
  for (let index = 1; index < chain.length; index++) {
    const previousBlock = block;
    block = chain[index];
    if (block.previousHash !== previousBlock.hashCode){
      throw new Error(`Block ${index} has an invalid previous hash: expected ${previousBlock.hashCode}, got ${block.previousHash}`);
    }
    try {
      verifyBlock(block);
    } catch (error){
      throw new Error(`Block ${index} hash is invalid: ${error.message}`);
    }
  }
}

const churn = (chain: Chain): Block => {
  let previousHash: string;

  if (chain.length === 0){
    previousHash = "0";
  } else {
    previousHash = chain[chain.length - 1].hashCode;
  }

  let nonce: number = Math.floor(Math.random() * 10000);
  let hashcode: string = hash(previousHash, nonce.toString(16));
  while (!hashcode.startsWith(difficulty)){
    nonce++;
    hashcode = hash(previousHash, nonce.toString(16));
  }

  return {
    hashCode: hashcode,
    nonce: nonce.toString(16),
    previousHash
  };
}

const run = () => {
  console.log("Building chain.");
  const chain: Chain = [];
  while (chain.length < 50){
    const block = churn(chain);
    console.log("Block found!")
    console.log(JSON.stringify(block));
    console.log(`Current height: ${chain.length}`);
    chain.push(block);
  }

  console.log("Compressing");
  const compressed = compress(chain);
  console.log(`[${compressed.join(", ")}]`);

  console.log(`Decompressing`);
  const chain2 = decompress(compressed);
  chain2.map(block => console.log(block));
};

run();