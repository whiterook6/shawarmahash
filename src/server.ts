import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import { schemas } from "./schemas";
import { Game } from "./game";
import { errorHandler } from "./errors";
import { DEFAULT_DIFFICULTY } from "./chain";
import { Miner } from "./miner";

export function createServer(game: Game) {
  const fastify = Fastify({
    logger: true,
  });

  fastify.setErrorHandler(errorHandler);

  // Endpoint to get chain for a player
  fastify.get(
    "/players/:player/chain",
    schemas.getPlayers,
    (
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
      if (chainState.recent.length === 0) {
        return reply
          .status(200)
          .send({ recent: [], difficulty: DEFAULT_DIFFICULTY });
      }
      return reply.status(200).send(chainState);
    },
  );

  // Endpoint to get all players
  fastify.get("/players", (_: FastifyRequest, reply: FastifyReply) => {
    const result = game.getAllPlayers();
    reply.status(200).send(result);
  });

  // Endpoint to get a player's score
  fastify.get(
    "/players/:player",
    schemas.getPlayers,
    (
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
  fastify.get("/teams", (_: FastifyRequest, reply: FastifyReply) => {
    const result = game.getAllTeams();
    reply.status(200).send(result);
  });

  // Endpoint to get a team's score
  fastify.get(
    "/teams/:team",
    schemas.getTeams,
    (
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
  fastify.get("/chat", (_: FastifyRequest, reply: FastifyReply) => {
    const result = game.getChat();
    reply.status(200).send(result);
  });

  // Endpoint to get recent chat messages to a player
  fastify.get(
    "/chat/players/:player",
    schemas.getPlayerChat,
    (
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
    (
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
    (
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
      const result = game.submitBlock(
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

  fastify.post(
    "/mine",
    schemas.mineBlock,
    (
      request: FastifyRequest<{
        Body: { team: string; player: string; message?: string };
      }>,
      reply: FastifyReply,
    ) => {
      const { team, player, message } = request.body;
      console.log(`Mining block for player ${player} and team ${team}`);
      const playerChain = game.getChainState(player);
      const newBlock = Miner.mineBlock(
        player,
        team,
        playerChain.recent,
        message,
      );
      const result = game.submitBlock(
        newBlock.hash,
        player,
        team,
        newBlock.nonce,
        newBlock.hash,
        message,
      );
      reply.status(200).send(result);
    },
  );

  return fastify;
}
