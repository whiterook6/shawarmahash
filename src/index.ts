import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import { schemas } from "./schemas";
import { Game } from "./game";
import { AddressInfo } from "net";
import { errorHandler } from "./errors";

// Start server
const start = async () => {
  const game = new Game();

  const fastify = Fastify({
    logger: true,
  });

  fastify.setErrorHandler(errorHandler);

  // Endpoint to get chain for a player
  fastify.get(
    "/players/:player/chain",
    schemas.getPlayers,
    async (
      request: FastifyRequest<{
        Params: {
          player: string;
        };
      }>,
      reply: FastifyReply,
    ) => {
      const { player } = request.params;
      const chainState = game.getChainState(player);
      // If there's no chain, return an empty array
      if (!game.chains.has(player) || chainState.recent.length === 0) {
        reply.status(200).send([]);
        return;
      }
      reply.status(200).send(chainState);
    },
  );

  // Endpoint to get all players
  fastify.get("/players", async (_: FastifyRequest, reply: FastifyReply) => {
    const result = game.getAllPlayers();
    reply.status(200).send(result);
  });

  // Endpoint to get a player's score
  fastify.get(
    "/players/:player",
    schemas.getPlayers,
    async (
      request: FastifyRequest<{
        Params: {
          player: string;
        };
      }>,
      reply: FastifyReply,
    ) => {
      const result = game.getPlayer(request.params.player);
      reply.status(200).send(result);
    },
  );

  // Endpoint to get all teams
  fastify.get("/teams", async (_: FastifyRequest, reply: FastifyReply) => {
    const result = game.getAllTeams();
    reply.status(200).send(result);
  });

  // Endpoint to get a team's score
  fastify.get(
    "/teams/:team",
    schemas.getTeams,
    async (
      request: FastifyRequest<{
        Params: {
          team: string;
        };
      }>,
      reply: FastifyReply,
    ) => {
      const result = game.getTeam(request.params.team);
      reply.status(200).send(result);
    },
  );

  // Endpoint to get recent chat messages
  fastify.get("/chat", async (_: FastifyRequest, reply: FastifyReply) => {
    const result = game.getChat();
    reply.status(200).send(result);
  });

  // Endpoint to get recent chat messages to a player
  fastify.get(
    "/chat/players/:player",
    schemas.getPlayerChat,
    async (
      request: FastifyRequest<{
        Params: {
          player: string;
        };
      }>,
      reply: FastifyReply,
    ) => {
      const result = game.getChatPlayer(request.params.player);
      reply.status(200).send(result);
    },
  );

  // Endpoint to get recent chat messages to a team
  fastify.get(
    "/chat/teams/:team",
    schemas.getTeamChat,
    async (
      request: FastifyRequest<{
        Params: {
          team: string;
        };
      }>,
      reply: FastifyReply,
    ) => {
      const result = game.getChatTeam(request.params.team);
      reply.status(200).send(result);
    },
  );

  // Endpoint to submit a mined block
  fastify.post(
    "/submit",
    schemas.submitBlock,
    async (
      request: FastifyRequest<{
        Body: {
          previousHash: string;
          player: string;
          team: string;
          nonce: number;
          hash: string;
          message?: string;
        };
      }>,
      reply: FastifyReply,
    ) => {
      const { previousHash, player, team, nonce, hash, message } = request.body;
      const result = await game.submitBlock(
        previousHash,
        player,
        team,
        nonce,
        hash,
        message,
      );
      reply.status(200).send(result);
    },
  );

  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
    const address = fastify.server.address() as AddressInfo;
    console.log(`Server listening on ${address.address}:${address.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
