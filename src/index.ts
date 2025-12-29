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

  const mineBlock = (previousBlock: Block, player: string): Block => {
    let nonce = 0;
    const previousHash = previousBlock.hash;
    const previousTimestamp = previousBlock.timestamp;
    const difficulty = calculateDifficulty(chain);
    while (true) {
      const currentHash = calculateHash(previousHash, previousTimestamp, player, nonce.toString(16));
      if (currentHash.startsWith(difficulty)) {
        return {
          hash: currentHash,
          player,
          timestamp: Date.now(),
          nonce: nonce.toString(16),
          index: chain.length,
        };
      }
      nonce++;
    }
  }

  const fastify = Fastify({
    logger: true
  });

  fastify.get("/mine", async (request: FastifyRequest<{ Querystring: { player: string } }>, reply: FastifyReply) => {
    const block = mineBlock(chain[chain.length - 1], request.query.player);
    chain.push(block);
    reply.status(200).send({
      chain: chain,
      difficulty: calculateDifficulty(chain)
    });
    await saveChain(chain, chainFilePath);
    console.log(`Block ${block.index} mined by ${block.player}`);
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

