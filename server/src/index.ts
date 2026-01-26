import { Game } from "./game/game";
import { createServer } from "./server/server";
import { Data } from "./data/data";
import { Broadcast } from "./broadcast/broadcast";
import { join } from "path";
import { EnvController } from "./env";
import { readFileSync, existsSync } from "fs";

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

  // dependency injection
  game.setData(data);
  game.setChains(chains);
  game.setBroadcast(broadcast);

  // Check for SSL certificates in multiple possible locations
  // 1. Docker: /app/certs (mounted volume)
  // 2. Development: ../certs (relative to project root)
  // 3. Project root: ./certs (if running from root)
  const possibleCertPaths = [
    "/app/certs/localhost.pem", // Docker
    join(process.cwd(), "..", "certs", "localhost.pem"), // Development (from server/output)
    join(process.cwd(), "certs", "localhost.pem"), // If running from project root
  ];

  const possibleKeyPaths = [
    "/app/certs/localhost-key.pem", // Docker
    join(process.cwd(), "..", "certs", "localhost-key.pem"), // Development
    join(process.cwd(), "certs", "localhost-key.pem"), // If running from project root
  ];

  let certPath: string | null = null;
  let keyPath: string | null = null;

  for (let i = 0; i < possibleCertPaths.length; i++) {
    if (existsSync(possibleCertPaths[i]) && existsSync(possibleKeyPaths[i])) {
      certPath = possibleCertPaths[i];
      keyPath = possibleKeyPaths[i];
      break;
    }
  }

  const httpsOptions =
    certPath && keyPath
      ? {
          key: readFileSync(keyPath),
          cert: readFileSync(certPath),
        }
      : undefined;

  const fastify = createServer(game, broadcast, data, httpsOptions);

  const shutdown = async () => {
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
    if (httpsOptions) {
      console.log("🚀 Server running on https://0.0.0.0:3000");
    } else {
      console.log("🚀 Server running on http://0.0.0.0:3000");
      console.log("💡 To enable HTTPS, run: ./scripts/generate-certs.sh");
    }
  } catch (err) {
    fastify.log.error(err, "Failed to start Fastify");
    await shutdown();
    process.exit(1);
  }
};

start();
