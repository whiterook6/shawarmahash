import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import ssePlugin, { SSEReplyInterface } from "@fastify/sse";
import { Block } from "./block";
import { Chain, verifyChain } from "./chain";
import { loadChain, saveChain, getDataFilePath } from "./data";
import { access } from "fs/promises";
import { constants } from "fs";
import { schemas } from "./schemas";
import { Game, ValidationError } from "./game";
import { AddressInfo } from "net";
import { Broadcast } from "./broadcast";

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
      player: "",
      team: "",
      timestamp: Date.now(),
      nonce: 0,
    };
    chain = [genesisBlock];
    await saveChain(chain, chainFilePath);
  }

  if (!verifyChain(chain)) {
    throw new Error("Invalid chain");
  }

  const game = new Game(chain, chainFilePath);

  const fastify = Fastify({
    logger: true
  });

  // Register SSE plugin
  await fastify.register(ssePlugin);

  const broadcast = new Broadcast();
  fastify.get("/events", { sse: true }, broadcast.addClient);

  
  fastify.get("/chain", async (_: FastifyRequest, reply: FastifyReply) => {
    reply.status(200).send(game.getChainState());
  });

  // Endpoint to get all players
  fastify.get("/players", async (_: FastifyRequest, reply: FastifyReply) => {
    const result = game.getAllPlayers();
    reply.status(200).send(result);
  });

  // Endpoint to get a player's score
  fastify.get("/players/:player", schemas.getPlayers, async (request: FastifyRequest<{
    Params: {
      player: string;
    }
  }>, reply: FastifyReply) => {
    const result = game.getPlayer(request.params.player);
    reply.status(200).send(result);
  });

  // Endpoint to get all teams
  fastify.get("/teams", async (_: FastifyRequest, reply: FastifyReply) => {
    const result = game.getAllTeams();
    reply.status(200).send(result);
  });

  // Endpoint to get a team's score
  fastify.get("/teams/:team", schemas.getTeams, async (request: FastifyRequest<{
    Params: {
      team: string;
    }
  }>, reply: FastifyReply) => {
    const result = game.getTeam(request.params.team);
    reply.status(200).send(result);
  });

  // Endpoint to get recent chat messages
  fastify.get("/chat", async (_: FastifyRequest, reply: FastifyReply) => {
    const result = game.getChat();
    reply.status(200).send(result);
  });

  // Endpoint to get recent chat messages to a player
  fastify.get("/chat/players/:player", schemas.getPlayerChat, async (request: FastifyRequest<{
    Params: {
      player: string;
    }
  }>, reply: FastifyReply) => {
    const result = game.getChatPlayer(request.params.player);
    reply.status(200).send(result);
  });

  // Endpoint to get recent chat messages to a team
  fastify.get("/chat/teams/:team", schemas.getTeamChat, async (request: FastifyRequest<{
    Params: {
      team: string;
    }
  }>, reply: FastifyReply) => {
    const result = game.getChatTeam(request.params.team);
    reply.status(200).send(result);
  });

  // Endpoint to submit a mined block
  fastify.post("/submit", schemas.submitBlock, async (request: FastifyRequest<{
    Body: {
      previousHash: string;
      player: string;
      team: string;
      nonce: number;
      hash: string;
      message?: string;
    }
  }>, reply: FastifyReply) => {
    try {
      const { previousHash, player, team, nonce, hash, message } = request.body;
      const result = await game.submitBlock(previousHash, player, team, nonce, hash, message);
      reply.status(200).send(result);
    } catch (error) {
      if (error instanceof ValidationError) {
        reply.status(400).send({
          error: error.message,
          ...game.getChainState()
        });
      } else {
        throw error;
      }
    }
  });

  // Testing endpoint to mine a new block
  fastify.post("/test/mine", schemas.mineBlock, async (request: FastifyRequest<{
    Body: {
      team: string;
      player: string;
      message?: string;
    }
  }>, reply: FastifyReply) => {
    try {
      const { team, player, message } = request.body;
      const result = await game.testMine(team, player, message);
      reply.status(200).send(result);
    } catch (error) {
      if (error instanceof ValidationError) {
        reply.status(400).send({
          error: error.message,
          ...game.getChainState()
        });
      } else {
        throw error;
      }
    }
  });

  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
    const address = fastify.server.address() as AddressInfo
    console.log(`Server listening on ${address.address}:${address.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

