import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import { Block, calculateHash } from "./block";
import { Chain, calculateDifficulty } from "./chain";
import { loadChain, saveChain, getDataFilePath } from "./data";
import { access } from "fs/promises";
import { constants } from "fs";

// Start server
const start = async () => {
  const chainFilePath = await getDataFilePath("chain");
  
  let chain: Chain;
  try {
    await access(chainFilePath, constants.F_OK);
    chain = await loadChain(chainFilePath);
  } catch {
    // File doesn't exist, create genesis block
    const genesisBlock: Block = {
      index: 0,
      hash: "0",
      player: "genesis",
      timestamp: Date.now(),
      nonce: "0",
    };
    chain = [genesisBlock];
    await saveChain(chain, chainFilePath);
  }

  let recentChain: Chain = chain.slice(-5);
  let difficulty: string = calculateDifficulty(chain);

  const fastify = Fastify({
    logger: true
  });

  const getChainState = () => ({
    recent: recentChain.reverse(),
    difficulty,
  });

  // Endpoint to get current chain state (for clients to know what to mine)
  fastify.get("/chain", async (_: FastifyRequest, reply: FastifyReply) => {
    reply.status(200).send(getChainState());
  });

  // Endpoint to submit a mined block
  fastify.post("/submit", async (request: FastifyRequest<{
    Body: {
      previousHash: string;
      player: string;
      nonce: string;
      hash: string;
    }
  }>, reply: FastifyReply) => {
    const { previousHash, player, nonce, hash: providedHash } = request.body;

    // verify the previous hash is correct
    const previousBlock = chain[chain.length - 1];
    if (previousHash !== previousBlock.hash) {
      return reply.status(400).send({
        error: `Invalid previous hash: ${previousHash} !== ${previousBlock.hash}`,
        ...getChainState()
      });
    }
    
    // verify the provided hash is correct
    const newBlockhash = calculateHash(
      previousBlock.hash,
      previousBlock.timestamp,
      player,
      nonce
    );
    if (providedHash !== newBlockhash) {
      return reply.status(400).send({
        error: `Invalid block hash: ${providedHash} !== ${newBlockhash}`,
        ...getChainState()
      });
    }

    // Verify the hash meets difficulty requirement
    if (!newBlockhash.startsWith(difficulty)) {
      return reply.status(400).send({ 
        error: `Block does not meet difficulty requirement: ${newBlockhash} does not start with ${difficulty}`,
        ...getChainState()
      });
    }

    // Create the new block
    const newBlock: Block = {
      index: chain.length,
      hash: newBlockhash,
      player: player,
      timestamp: Date.now(),
      nonce: nonce,
    };

    // Append to chain
    chain.push(newBlock);
    await saveChain(chain, chainFilePath);

    recentChain = chain.slice(-5);
    difficulty = calculateDifficulty(chain);

    reply.status(200).send(getChainState());
    console.log(`Block ${newBlock.index} mined by ${newBlock.player}`);
  });

  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
    console.log(`Server listening on ${fastify.server.address()!}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

