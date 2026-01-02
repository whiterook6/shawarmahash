import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import { errorHandler } from "./error/errors";
import { Game } from "./game/game";
import { Miner } from "./miner/miner";

export async function createServer(game: Game) {
  const fastify = Fastify({
    logger: true,
  });

  await fastify.register(helmet);
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: "1m",
  });

  fastify.setErrorHandler(errorHandler);

  // GET /players: get a list of players and their scores (PlayerScore[])
  fastify.get("/players", (_: FastifyRequest, reply: FastifyReply) => {
    const playerScores = game.getAllPlayerScores();
    return reply.status(200).send(playerScores);
  });

  // GET /players/:player/score: get the player's score (PlayerScore)
  fastify.get("/players/:player/score", (
      request: FastifyRequest<{
        Params: { player: string };
      }>,
      reply: FastifyReply,
    ) => {
      const score = game.getPlayerScore(request.params.player);
      return reply.status(200).send({
        player: request.params.player,
        score,
      });
    },
  );

  // GET /players/:player/messages: get the player's messages (PlayerMessages)
  fastify.get("/players/:player/messages", (
    request: FastifyRequest<{
      Params: { player: string };
    }>,
    reply: FastifyReply,
  ) => {
    return reply.status(200).send({});
  });

  // GET /players/:player/chain: get the player's recent blocks and difficulty (ChainState)
  fastify.get("/players/:player/chain", (
    request: FastifyRequest<{
      Params: { player: string };
    }>,
    reply: FastifyReply,
  ) => {
    const playerChainState = game.getChainState(request.params.player);
    return reply.status(200).send(playerChainState);
  });

  // GET /players/:player/team: get the player's most recent block's team, or undefined
  fastify.get("/players/:player/team",(
    request: FastifyRequest<{
    Params: { player: string };
  }>,
    reply: FastifyReply,
  ) => {
    return reply.status(200).send({});
  });

  // GET /teams: get the list of teams and their scores (TeamScore[])
  fastify.get("/teams", (_: FastifyRequest, reply: FastifyReply) => {
    const teamScores = game.getAllTeams();
    return reply.status(200).send(teamScores);
  });

  // GET /teams/:team/score: get the score across all player's chains for the team (TeamScore)
  fastify.get(
    "/teams/:team/score",
    (
      request: FastifyRequest<{
        Params: { team: string };
      }>,
      reply: FastifyReply,
    ) => {
      const teamScore = game.getTeamScore(request.params.team);
      return reply.status(200).send({
        team: request.params.team,
        score: teamScore,
      });
    },
  );

  // GET /teams/:team/messages: get the messages in blocks owned by the team (TeamMessages)
  fastify.get(
    "/teams/:team/messages",
    (
      request: FastifyRequest<{
        Params: { team: string };
      }>,
      reply: FastifyReply,
    ) => {
      return reply.status(200).send({});
    },
  );

  // GET /teams/:team/players: get the players whose most recent block is owned by the team
  fastify.get(
    "/teams/:team/players",
    (
      request: FastifyRequest<{
        Params: { team: string };
      }>,
      reply: FastifyReply,
    ) => {
      return reply.status(200).send({});
    },
  );

  // POST /players/:player: create a genesis block for the player, if needed, then return the chain state
  fastify.post(
    "/players/:player",
    async (
      request: FastifyRequest<{
        Params: { player: string };
      }>,
      reply: FastifyReply,
    ) => {
      const chainState = await game.createPlayer(request.params.player);
      return reply.status(200).send(chainState);
    },
  );

  // POST /players/:player/chain: attempt to submit a block to the player's chain
  fastify.post(
    "/players/:player/chain",
    async (
      request: FastifyRequest<{
        Params: { player: string };
        Body: {
          previousHash: string;
          team: string;
          nonce: number;
          hash: string;
          message?: string;
        };
      }>,
      reply: FastifyReply,
    ) => {
      const block = await game.submitBlock(
        request.body.previousHash,
        request.params.player,
        request.body.team,
        request.body.nonce,
        request.body.hash,
        request.body.message,
      );
      return reply.status(200).send(block);
    },
  );

  // POST /test/mint: a test function to mine a block for a player and a team
  fastify.post(
    "/test/mint",
    async (
      request: FastifyRequest<{
        Body: {
          player: string;
          team: string;
          message?: string;
        };
      }>,
      reply: FastifyReply,
    ) => {
      const chainState = await game.getChainState(request.body.player);
      const block = Miner.mineBlock(
        request.body.player,
        request.body.team,
        chainState.recent,
        request.body.message,
      );
      await game.submitBlock(
        block.previousHash,
        request.body.player,
        request.body.team,
        block.nonce,
        block.hash,
        request.body.message,
      );
      return reply.status(200).send(block);
    },
  );

  return fastify;
}
