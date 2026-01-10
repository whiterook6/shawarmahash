import { Game } from "./game/game";
import { createServer } from "./server/server";
import { Data } from "./data/data";
import { Broadcast } from "./broadcast/broadcast";
import { join } from "path";

// Start server
const start = async () => {
  // Load player chains from data directory
  const data = new Data(join(process.cwd(), "data"));
  const chains = await data.loadAllChains();

  // start game and broadcast
  const broadcast = new Broadcast();
  const game = new Game();

  // dependency injection
  game.setData(data);
  game.setChains(chains);
  game.setBroadcast(broadcast);

  const fastify = createServer(game, broadcast, data, {
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
