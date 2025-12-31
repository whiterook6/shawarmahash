import { AddressInfo } from "net";
import { Game } from "./game";
import { createServer } from "./server";

// Start server
const start = async () => {
  const game = new Game();
  const fastify = createServer(game);

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

  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
    const address = fastify.server.address() as AddressInfo;
    console.log(`Server listening on ${address.address}:${address.port}`);
  } catch (err) {
    fastify.log.error(err, "Failed to start Fastify");
    await shutdown();
    process.exit(1);
  }
};

start();
