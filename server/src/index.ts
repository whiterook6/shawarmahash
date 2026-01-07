import { Game } from "./game/game";
import { createServer } from "./server";
import { Data } from "./data/data";
import { Broadcast } from "./broadcast/broadcast";

// Start server
const start = async () => {
  // Load player chains from data directory
  const chains = await Data.loadAllChains("data");

  // start game and broadcast
  const broadcast = new Broadcast();
  const game = new Game();
  game.setChains(chains);
  game.setBroadcast(broadcast);

  const fastify = createServer(game, broadcast, {
    gitHash: process.env.GIT_HASH,
  });

  const shutdown = async () => {
    try {
      await fastify.close();
    } catch (err) {
      fastify.log.error(err, "Failed to close Fastify");
    }
    // Add any other cleanup here (e.g., database connections, file handles, etc.)
  };

  process.on("SIGTERM", () => {
    shutdown().finally(() => {
      process.exit(0);
    });
  });
  process.on("SIGINT", () => {
    shutdown().finally(() => {
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
  } catch (err) {
    fastify.log.error(err, "Failed to start Fastify");
    await shutdown();
    process.exit(1);
  }
};

start();
