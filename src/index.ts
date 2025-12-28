import Fastify, { FastifyRequest } from "fastify";
import crypto from "crypto";
import { Chain } from "./chain";
import { Block, PendingBlock } from "./block";

const fastify = Fastify({
  logger: true
});

const chain: Chain = [{
  index: 0,
  player: "0",
  timestamp: Date.now(),
  nonce: "0",
  hash: "0"
}];

const calculateHash = (
  previousHash: string,
  previousTimestamp: number,
  player: string,
  nonce: string
) => {
  return crypto.createHash("sha256").update(
    `${previousHash}${previousTimestamp}${player}${nonce}`
  ).digest("hex");
};

const mineBlock = (previousBlock: Block, player: string): Block => {
  let nonce = 0;
  const previousHash = previousBlock.hash;
  const previousTimestamp = previousBlock.timestamp;
  while (true) {
    const currentHash = calculateHash(previousHash, previousTimestamp, player, nonce.toString(16));
    if (currentHash.startsWith("00")) {
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

fastify.get("/mine", async (request: FastifyRequest<{ Querystring: { player: string } }>) => {
  const block = mineBlock(chain[chain.length - 1], request.query.player);
  chain.push(block);
  return {
    chain: chain
  };
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
    console.log(`Server listening on ${fastify.server.address()!}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

