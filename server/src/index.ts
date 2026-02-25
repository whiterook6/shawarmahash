import { Game } from "./game/game";
import { createServer } from "./server/server";
import { Data } from "./data/data";
import { Broadcast } from "./broadcast/broadcast";
import { join } from "path";
import { EnvController } from "./env";
import { Announcer } from "./announcer";
import { Chat } from "./chat/chat";
import { startHealthcheckPing } from "./healthcheck";

// Start server
const start = async () => {
  EnvController.verifyEnv();
  EnvController.printENV();

  // Load player chains from data directory
  const data = new Data(join(process.cwd(), "data"));
  const chains = await data.loadAllChains();

  // start game and broadcast
  const broadcast = new Broadcast();
  const game = new Game();
  const announcer = new Announcer();
  const chat = new Chat();

  // dependency injection
  game.setData(data);
  game.setChains(chains);
  game.setBroadcast(broadcast);
  game.setChat(chat);
  chat.setBroadcast(broadcast);
  announcer.setBroadcast(broadcast);
  announcer.setGame(game);
  announcer.start();

  const fastify = createServer(game, broadcast, data);
  let stopHealthcheckPing: (() => void) | null = null;

  const shutdown = async () => {
    if (stopHealthcheckPing) {
      stopHealthcheckPing();
    }
    announcer.stop();
    console.log("[Shutdown] Starting graceful shutdown...");
    try {
      // Close all SSE connections first to allow the server to exit cleanly
      broadcast.closeAll();
      // Give connections a moment to close
      await new Promise((resolve) => setTimeout(resolve, 100));
      await fastify.close();
    } catch (err) {
      fastify.log.error(err, "Failed to close Fastify");
    }
    // Add any other cleanup here (e.g., database connections, file handles, etc.)
  };

  // Set up a timeout to force exit if shutdown takes too long
  let shutdownTimeout: NodeJS.Timeout | null = null;
  const forceExit = () => {
    if (shutdownTimeout) {
      clearTimeout(shutdownTimeout);
    }
    console.log("[Shutdown] Forcing exit after timeout");
    process.exit(0);
  };

  process.on("SIGTERM", () => {
    shutdownTimeout = setTimeout(forceExit, 5000); // Force exit after 5 seconds
    shutdown().finally(() => {
      if (shutdownTimeout) {
        clearTimeout(shutdownTimeout);
      }
      process.exit(0);
    });
  });
  process.on("SIGINT", () => {
    shutdownTimeout = setTimeout(forceExit, 5000); // Force exit after 5 seconds
    shutdown().finally(() => {
      if (shutdownTimeout) {
        clearTimeout(shutdownTimeout);
      }
      process.exit(0);
    });
  });
  process.on("uncaughtException", (err) => {
    fastify.log.error(err, "Uncaught exception");
    shutdown().finally(() => {
      process.exit(1);
    });
  });
  process.on("unhandledRejection", (err) => {
    fastify.log.error(err, "Unhandled rejection");
    shutdown().finally(() => {
      process.exit(1);
    });
  });

  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
    console.log("🚀 Server running on http://0.0.0.0:3000");
    if (EnvController.env.HEALTHCHECK_PING_URL) {
      stopHealthcheckPing = startHealthcheckPing(
        EnvController.env.HEALTHCHECK_PING_URL,
      );
    }
  } catch (err) {
    fastify.log.error(err, "Failed to start Fastify");
    await shutdown();
    process.exit(1);
  }
};

start();
