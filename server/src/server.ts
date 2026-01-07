import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import staticFiles from "@fastify/static";
import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { errorHandler } from "./error/errors";
import { Game } from "./game/game";
import { Miner } from "./miner/miner";
import { Broadcast, Message } from "./broadcast/broadcast";

export type Options = {
  gitHash?: string;
};

export function createServer(
  game: Game,
  broadcast: Broadcast,
  options: Options = {},
) {
  const fastify = Fastify({
    logger: true,
  });
  
  fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        scriptSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  });
  fastify.register(rateLimit, {
    max: 100,
    timeWindow: "1m",
  });

  fastify.setErrorHandler(errorHandler);

  const serverStartTime = new Date();
  fastify.get("/health", (_: FastifyRequest, reply: FastifyReply) => {
    const now = new Date();
    return reply.status(200).send({
      gitHash: options.gitHash || "unknown",
      startTime: serverStartTime,
      now: now,
      uptime: (now.getTime() - serverStartTime.getTime()) / 1000,
    });
  });

  // GET /players: get a list of players and their scores (PlayerScore[])
  fastify.get("/players", (_: FastifyRequest, reply: FastifyReply) => {
    const playerScores = game.getAllPlayerScores();
    return reply.status(200).send(playerScores);
  });

  // GET /players/:player/score: get the player's score (PlayerScore)
  fastify.get(
    "/players/:player/score",
    (
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
  fastify.get(
    "/players/:player/messages",
    (
      request: FastifyRequest<{
        Params: { player: string };
      }>,
      reply: FastifyReply,
    ) => {
      const messages = game.getPlayerMessages(request.params.player);
      return reply.status(200).send(messages);
    },
  );

  // GET /players/:player/chain: get the player's recent blocks and difficulty (ChainState)
  fastify.get(
    "/players/:player/chain",
    (
      request: FastifyRequest<{
        Params: { player: string };
      }>,
      reply: FastifyReply,
    ) => {
      const playerChainState = game.getChainState(request.params.player);
      return reply.status(200).send(playerChainState);
    },
  );

  // GET /players/:player/team: get the player's most recent block's team, or undefined
  fastify.get(
    "/players/:player/team",
    (
      request: FastifyRequest<{
        Params: { player: string };
      }>,
      reply: FastifyReply,
    ) => {
      const team = game.getPlayerTeam(request.params.player);
      return reply.status(200).send({
        player: request.params.player,
        team,
      });
    },
  );

  // GET /teams: get the list of teams and their scores (TeamScore[])
  fastify.get("/teams", (_: FastifyRequest, reply: FastifyReply) => {
    const teamScores = game.getAllTeamScores();
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
      const messages = game.getTeamMessages(request.params.team);
      return reply.status(200).send(messages);
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
      const players = game.getTeamPlayers(request.params.team);
      return reply.status(200).send(players);
    },
  );

  // POST /players/:player: create a genesis block for the player using user-provided hash/nonce
  fastify.post(
    "/players/:player",
    async (
      request: FastifyRequest<{
        Params: { player: string };
        Body: {
          hash: string;
          nonce: number;
        };
      }>,
      reply: FastifyReply,
    ) => {
      const chainState = await game.createPlayer(
        request.params.player,
        request.body.hash,
        request.body.nonce,
      );
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

  // GET /events: Server-Sent Events endpoint
  fastify.get("/events", async (_: FastifyRequest, reply: FastifyReply) => {
    // Set SSE headers
    reply.raw.setHeader("Content-Type", "text/event-stream");
    reply.raw.setHeader("Cache-Control", "no-cache");
    reply.raw.setHeader("Connection", "keep-alive");

    const unsubscribe = broadcast.subscribe({
      send: (data: Message) => {
        reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
      },
      close: () => {
        reply.raw.end();
      },
    });

    // Clean up on client disconnect
    reply.raw.on("close", () => {
      unsubscribe();
    });
  });

  // Serve static files from webui directory (registered last so API routes take precedence)
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const webuiPath = join(__dirname, "../../webui");
  fastify.register(staticFiles, {
    root: webuiPath,
    prefix: "/",
  });

  return fastify;
}
