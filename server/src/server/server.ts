import cookie from "@fastify/cookie";
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
import { IdentityController } from "../identity/identity.controller";
import { EnvController } from "../env";
import { schemas } from "./schemas";

export function createServer(
  game: Game,
  broadcast: Broadcast,
  data: Data,
  httpsOptions?: { key: Buffer; cert: Buffer },
) {
  const fastify = Fastify({
    logger: false,
    ...(httpsOptions && { https: httpsOptions }),
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

  fastify.register(cookie);

  fastify.setErrorHandler(errorHandler);

  // GET /api/health: get the health of the server
  const serverStartTime = new Date();
  fastify.get(
    "/api/health",
    schemas.getHealth,
    async (_: FastifyRequest, reply: FastifyReply) => {
      const now = new Date();
      const memoryUsage = process.memoryUsage();
      const activeChains = game.getActiveChainsCount();
      const totalBlocks = game.getTotalBlocksCount();
      const dataDirectoryStatus = await data.getDirectoryStatus();
      const sseClients = broadcast.getSubscriberCount();

      return reply.status(200).send({
        gitHash: EnvController.env.GIT_HASH,
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

  // POST /api/identity: ensure an identity cookie is present (anonymous session)
  fastify.post(
    "/api/identity",
    schemas.postIdentity,
    async (_: FastifyRequest, reply: FastifyReply) => {
      const identityToken = IdentityController.generateIdentityToken();
      reply.setCookie("identityToken", identityToken, {
        path: "/",
        httpOnly: true,
        secure: EnvController.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365, // 1 year
      });
      return reply.status(200).send({ identityToken });
    },
  );

  // GET /api/players/top: get the top 10 players and their scores (PlayerScore[])
  fastify.get(
    "/api/players/top",
    schemas.getTopPlayers,
    (_: FastifyRequest, reply: FastifyReply) => {
      const topPlayers = game.getTopPlayers();
      return reply.status(200).send(topPlayers);
    },
  );

  // GET /api/teams/top: get the top 10 teams and their scores (TeamScore[])
  fastify.get(
    "/api/teams/top",
    schemas.getTopTeams,
    (_: FastifyRequest, reply: FastifyReply) => {
      const topTeams = game.getTopTeams();
      return reply.status(200).send(topTeams);
    },
  );

  // GET /api/players: get a list of players and their scores (PlayerScore[])
  fastify.get(
    "/api/players",
    schemas.getPlayers,
    (_: FastifyRequest, reply: FastifyReply) => {
      const playerScores = game.getAllPlayerScores();
      return reply.status(200).send(playerScores);
    },
  );

  fastify.get(
    "/api/players/me/score",
    schemas.getPlayerScore,
    (request: FastifyRequest, reply: FastifyReply) => {
      const identity = request.cookies.identityToken;
      if (!identity) {
        return reply.status(401).send({ error: "Unauthorized" });
      }
      const derivedIdentity = IdentityController.generateDerivedIdentityToken({
        identityToken: identity,
        secret: EnvController.env.IDENTITY_SECRET,
      });
      const score = game.getPlayerScore(derivedIdentity);
      return reply.status(200).send({ identity, score, you: true });
    },
  );

  // GET /api/players/:identity/score: get the player's lifetime score (by identity)
  fastify.get(
    "/api/players/:identity/score",
    schemas.getPlayerScore,
    (
      request: FastifyRequest<{
        Params: { identity: string };
      }>,
      reply: FastifyReply,
    ) => {
      const score = game.getPlayerScore(request.params.identity);
      return reply.status(200).send({
        identity: request.params.identity,
        score,
      });
    },
  );

  // GET /api/teams: get the list of teams and their scores (TeamScore[])
  fastify.get(
    "/api/teams",
    schemas.getTeams,
    (_: FastifyRequest, reply: FastifyReply) => {
      const teamScores = game.getAllTeamScores();
      return reply.status(200).send(teamScores);
    },
  );

  // GET /api/teams/:team/score: get the score across all player's chains for the team (TeamScore)
  fastify.get(
    "/api/teams/:team/score",
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

  // GET /api/teams/:team/players: get the players whose most recent block is owned by the team
  fastify.get(
    "/api/teams/:team/players",
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

  // GET /api/teams/:team: get the info needed to mine a new block
  fastify.get(
    "/api/teams/:team",
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
          team: request.params.team,
          previousHash: Block.GENESIS_PREVIOUS_HASH,
          previousTimestamp: 0,
          difficulty: Difficulty.DEFAULT_DIFFICULTY_HASH,
        });
      }

      // Get the last block from the recent blocks
      const lastBlock = recent[recent.length - 1];
      return reply.status(200).send({
        team: request.params.team,
        previousHash: lastBlock.hash,
        previousTimestamp: lastBlock.timestamp,
        difficulty: chainState.difficulty,
      });
    },
  );

  // POST /api/teams/:team/chain: submit a block (handles both genesis and append cases)
  fastify.post(
    "/api/teams/:team/chain",
    schemas.submitBlock,
    async (
      request: FastifyRequest<{
        Params: { team: string };
        Body: {
          previousHash: string;
          player: string;
          nonce: number;
          identity: string;
          hash: string;
        };
      }>,
      reply: FastifyReply,
    ) => {
      const { team } = request.params;
      const { previousHash, player, nonce, identity, hash } = request.body;

      const derivedIdentity = IdentityController.generateDerivedIdentityToken({
        identityToken: identity,
        secret: EnvController.env.IDENTITY_SECRET,
      });

      const chainState = await game.submitBlock({
        previousHash,
        player,
        team,
        nonce,
        identity: derivedIdentity,
        hash,
      });

      return reply.status(200).send({
        team,
        ...chainState,
      });
    },
  );

  // GET /api/events: Server-Sent Events endpoint
  fastify.get("/api/events", async (_: FastifyRequest, reply: FastifyReply) => {
    reply.hijack();

    // Set SSE headers
    reply.raw.setHeader("Content-Type", "text/event-stream");
    reply.raw.setHeader("Cache-Control", "no-cache");
    reply.raw.setHeader("Connection", "keep-alive");
    reply.raw.setHeader("X-Accel-Buffering", "no");

    // Send initial connection message
    try {
      reply.raw.write(
        `data: ${JSON.stringify({ type: "connection", payload: { status: "open" } })}\n\n`,
      );
    } catch {
      // Client may have disconnected immediately
      return;
    }

    let isClosed = false;
    const unsubscribe = broadcast.subscribe({
      send: (data: Message) => {
        if (!isClosed) {
          try {
            reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
          } catch {
            // Connection closed or error writing
            isClosed = true;
            unsubscribe();
          }
        }
      },
      close: () => {
        if (!isClosed) {
          isClosed = true;
          try {
            // End the response and destroy the socket to ensure clean closure
            reply.raw.end();
            // Also destroy the socket if it exists to force immediate closure
            if (reply.raw.socket && !reply.raw.socket.destroyed) {
              reply.raw.socket.destroy();
            }
          } catch {
            // Ignore errors when closing
          }
        }
      },
    });

    // Clean up on client disconnect
    reply.raw.on("close", () => {
      console.log("[SSE] Client connection closed");
      unsubscribe();
    });
    reply.raw.on("error", (error) => {
      console.log("[SSE] Client connection error:", error);
      unsubscribe();
    });
  });

  // Serve static files from webui/dist directory (registered last so API routes take precedence)
  // Use WEBUI_DIST_PATH environment variable if set, otherwise use relative path from built output
  const webuiDistPath =
    process.env.WEBUI_DIST_PATH ||
    (() => {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      return join(__dirname, "../../webui/dist");
    })();

  fastify.register(staticFiles, {
    root: webuiDistPath,
    prefix: "/",
  });

  // Catch-all route for SPA: serve index.html for any non-API route
  fastify.setNotFoundHandler(
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Don't serve index.html for API routes
      if (request.url.startsWith("/api")) {
        return reply.status(404).send({ error: "Not found" });
      }

      // Serve index.html for all other routes (SPA routing)
      return reply.sendFile("index.html", webuiDistPath);
    },
  );

  return fastify;
}
