import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import staticFiles from "@fastify/static";
import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { Block } from "../block/block";
import { Broadcast, Message } from "../broadcast/broadcast";
import { Data } from "../data/data";
import { Difficulty } from "../difficulty/difficulty";
import { errorHandler } from "../error/errors";
import { Game } from "../game/game";
import { schemas } from "./schemas";

export type Options = {
  gitHash?: string;
};

export function createServer(
  game: Game,
  broadcast: Broadcast,
  data: Data,
  options: Options = {},
) {
  const fastify = Fastify({
    logger: process.env.NODE_ENV === "production",
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
  fastify.get(
    "/health",
    schemas.getHealth,
    async (_: FastifyRequest, reply: FastifyReply) => {
      const now = new Date();
      const memoryUsage = process.memoryUsage();
      const activeChains = game.getActiveChainsCount();
      const totalBlocks = game.getTotalBlocksCount();
      const dataDirectoryStatus = await data.getDirectoryStatus();
      const sseClients = broadcast.getSubscriberCount();

      return reply.status(200).send({
        gitHash: options.gitHash || "unknown",
        startTime: serverStartTime,
        now: now,
        uptime: (now.getTime() - serverStartTime.getTime()) / 1000,
        activeChains,
        totalBlocks,
        memoryUsage: {
          rss: memoryUsage.rss,
          heapTotal: memoryUsage.heapTotal,
          heapUsed: memoryUsage.heapUsed,
          external: memoryUsage.external,
        },
        dataDirectory: dataDirectoryStatus,
        sseClients,
      });
    },
  );

  // GET /players/top: get the top 10 players and their scores (PlayerScore[])
  fastify.get(
    "/players/top",
    schemas.getTopPlayers,
    (_: FastifyRequest, reply: FastifyReply) => {
      const topPlayers = game.getTopPlayers();
      return reply.status(200).send(topPlayers);
    },
  );

  // GET /teams/top: get the top 10 teams and their scores (TeamScore[])
  fastify.get(
    "/teams/top",
    schemas.getTopTeams,
    (_: FastifyRequest, reply: FastifyReply) => {
      const topTeams = game.getTopTeams();
      return reply.status(200).send(topTeams);
    },
  );

  // GET /players: get a list of players and their scores (PlayerScore[])
  fastify.get(
    "/players",
    schemas.getPlayers,
    (_: FastifyRequest, reply: FastifyReply) => {
      const playerScores = game.getAllPlayerScores();
      return reply.status(200).send(playerScores);
    },
  );

  // GET /players/:player/score: get the player's score (PlayerScore)
  fastify.get(
    "/players/:player/score",
    schemas.getPlayerScore,
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
    schemas.getPlayerMessages,
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

  // GET /teams: get the list of teams and their scores (TeamScore[])
  fastify.get(
    "/teams",
    schemas.getTeams,
    (_: FastifyRequest, reply: FastifyReply) => {
      const teamScores = game.getAllTeamScores();
      return reply.status(200).send(teamScores);
    },
  );

  // GET /teams/:team/score: get the score across all player's chains for the team (TeamScore)
  fastify.get(
    "/teams/:team/score",
    schemas.getTeamScore,
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
    schemas.getTeamMessages,
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
    schemas.getTeamPlayers,
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

  // GET /teams/:team: get the info needed to mine a new block
  fastify.get(
    "/teams/:team",
    schemas.getTeam,
    (
      request: FastifyRequest<{
        Params: { team: string };
      }>,
      reply: FastifyReply,
    ) => {
      const chainState = game.getChainState(request.params.team);
      const recent = chainState.recent;

      // If there's no chain (genesis block case)
      if (recent.length === 0) {
        return reply.status(200).send({
          previousHash: Block.GENESIS_PREVIOUS_HASH,
          previousTimestamp: 0,
          difficulty: Difficulty.DEFAULT_DIFFICULTY_HASH,
        });
      }

      // Get the last block from the recent blocks
      const lastBlock = recent[recent.length - 1];
      return reply.status(200).send({
        previousHash: lastBlock.hash,
        previousTimestamp: lastBlock.timestamp,
        difficulty: chainState.difficulty,
      });
    },
  );

  // POST /teams/:team/chain: submit a block (handles both genesis and append cases)
  fastify.post(
    "/teams/:team/chain",
    schemas.submitBlock,
    async (
      request: FastifyRequest<{
        Params: { team: string };
        Body: {
          previousHash: string;
          player: string;
          nonce: number;
          hash: string;
          message?: string;
        };
      }>,
      reply: FastifyReply,
    ) => {
      const { team } = request.params;
      const { previousHash, player, nonce, hash, message } = request.body;

      const chainState = await game.submitBlock({
        previousHash,
        player,
        team,
        nonce,
        hash,
        message,
      });

      return reply.status(200).send(chainState);
    },
  );

  // GET /events: Server-Sent Events endpoint
  fastify.get("/events", async (_: FastifyRequest, reply: FastifyReply) => {
    // Set SSE headers
    reply.raw.setHeader("Content-Type", "text/event-stream");
    reply.raw.setHeader("Cache-Control", "no-cache");
    reply.raw.setHeader("Connection", "keep-alive");
    reply.raw.write(
      `data: ${JSON.stringify({ type: "connection", status: "open" })}\n\n`,
    );

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
