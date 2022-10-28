import Express, { NextFunction, Request, Response } from "express";
import fs from "fs/promises";
import { Server } from "https";
import helmet from "helmet";
import { createServer as createHttps } from "https";
import path from "path";
import {
  buildDifficultyTargetString,
  Chain,
  verifyChain,
} from "./Chain";
import { Game } from "./Game";
import { loadChain, makeDataDir, saveChain } from "./Serialize";
import { BlockFoundMSG } from "./MessageTypes";
import { ChatHistory, ChatMessage } from "./Chat";

const buildServer = async (app: Express.Application): Promise<Server> => {
  const [cert, key] = await Promise.all([
    fs.readFile(path.join(__dirname, "../certificates/cert.pem")),
    fs.readFile(path.join(__dirname, "../certificates/key.pem")),
  ]);
  const server = createHttps({ cert, key }, app);

  return new Promise((resolve) => {
    server.listen(8080, () => {
      console.log("Server listening on 8080.");
      resolve(server);
    });
  });
};

let nextSSEClientID = 0;
const getNextID = () => nextSSEClientID++;

const run = async () => {
  await makeDataDir();

  const indexFile = path.join(__dirname + "/../../static/index.html");
  try {
    await fs.stat(indexFile);
  } catch (error) {
    console.error("Could not find index.html");
    process.exit(1);
  }

  let chain;
  try {
    chain = await loadChain();
    verifyChain(
      chain,
      buildDifficultyTargetString(5) // minimum difficulty
    );
  } catch (error) {
    console.error(error);
    chain = [] as Chain;
  }

  const game = new Game(chain);
  const chat = new ChatHistory();
  const app = Express();

  app.use(Express.json());

  // security
  app.disable("x-powered-by");
  app.use(helmet());

  const clients = new Map<number, Express.Response>();
  const broadcast = (event: string, data: unknown) => {
    for (const client of clients.values()) {
      client.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    }
  };

  const sendToClient = (clientID: number, event: string, data: unknown) => {
    if (!clients.has(clientID)) {
      return;
    }

    clients.get(clientID)!.write(
      `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
    );
  }

  app.get("/watch", (request: Request, response: Response) => {
    const headers = {
      "Content-Type": "text/event-stream",
      "Connection": "keep-alive",
      "Cache-Control": "no-cache",
    };
    response.writeHead(200, headers);
    const clientID = getNextID();
    clients.set(clientID, response);

    request.on("close", () => {
      clients.delete(clientID);
      console.log(`Client ${clientID} disconnected`);
    });

    sendToClient(clientID, "init", {clientID});
    console.log(`Client ${clientID} connected.`);
  });

  app.get("/api/players", async (_: Request, response: Response) => {
    try {
      return response.status(200).send(game.getPlayers());
    } catch (error) {
      console.error(error);
      return response.status(503).send();
    }
  });

  app.get(
    "/api/players/:player",
    async (request: Request, response: Response) => {
      try {
        const player = request.params.player as string;
        if (!player || player.length !== 3) {
          return response.status(400).send("Invalid player name");
        }
        return response
          .status(200)
          .send(game.getPlayerScore(player).toString(10));
      } catch (error) {
        console.error(error);
        return response.status(503).send();
      }
    }
  );

  app.get("/api/teams", async (_: Request, response: Response) => {
    try {
      return response.status(200).send(game.getTeams());
    } catch (error) {
      console.error(error);
      return response.status(503).send();
    }
  });

  app.get(
    "/api/teams/:team",
    async (request: Request, response: Response) => {
      try {
        const team = request.params.team as string;
        if (team && team.length !== 3) {
          return response.status(400).send("Invalid team name");
        }

        return response.status(200).send(game.getTeamScore(team).toString(10));
      } catch (error) {
        console.error(error);
        return response.status(503).send();
      }
    }
  );

  app.get("/api/mining/target", async (_: Request, response: Response) => {
    try {
      return response.status(200).send(game.getDifficultyTarget());
    } catch (error) {
      console.error(error);
      return response.status(503).send();
    }
  });

  app.get("/api/blocks/recent", async (_: Request, response: Response) => {
    try {
      return response.status(200).send(game.getRecentBlocks());
    } catch (error) {
      console.error(error);
      return response.status(503).send();
    }
  });

  app.get(
    "/api/blocks/:height",
    async (request: Request, response: Response) => {
      try {
        const height = parseInt(request.params.height, 10);
        const chainHeight = game.getHeight();
        if (height < 0){
          return response.status(400).send("Invalid block height");
        } else if (height >= chainHeight) {
          return response.status(404).send();
        } else {
          return response.status(200).send(game.getBlockAt(height));
        }
      } catch (error) {
        console.error(error);
        return response.status(503).send();
      }
    }
  );

  app.post(
    "/api/blocks",
    async (request: Request, response: Response) => {
      let block;
      let newTarget;
      try {
        const possibleBlock = request.body;
        if (!possibleBlock || typeof possibleBlock !== "object") {
          return response.status(400).send("Invalid block: empty.");
        }

        try {
          block = game.addBlock(possibleBlock as object);
        } catch (error) {
          return response.status(400).send((error as Error).message);
        }

        newTarget = game.getDifficultyTarget();
        response.status(200).send({
          block,
          newTarget
        });
      } catch (error) {
        console.error(error);
        return response.status(503).send();
      }

      try {
        broadcast("block-found", {
          block,
          difficultyTarget: newTarget,
        } as BlockFoundMSG);
        await saveChain(game.getChain());
      } catch (error) {
        console.error(error);
      }
    }
  );

  app.get("/api/chat/recent", async (_: Request, response: Response) => {
    try {
      return response.status(200).send(chat.getRecentMessages(100));
    } catch (error) {
      console.error(error);
      return response.status(503).send();
    }
  });

  app.post("/api/chat", async (request: Request, response: Response) => {
    try {
      const newMessage = request.body as ChatMessage;
      if (!newMessage || typeof newMessage !== "object") {
        return response.status(400).send("Invalid message: empty.");
      }

      if (!newMessage.fromPlayer || newMessage.fromPlayer.length !== 3) {
        return response.status(400).send("Invalid message: invalid player.");
      }
      if (!newMessage.content || newMessage.content.length === 0) {
        return response.status(400).send("Invalid message: empty content.");
      } else if (newMessage.content.length > 1023){
        return response.status(400).send("Invalid message: content too long.");
      }

      const message = chat.addMessage(newMessage);
      response.status(200).send(message);

      broadcast("chat-message", message);
    } catch (error) {
      console.error(error);
      return response.status(503).send();
    }
  });

  // fallback for other API routes
  app.all("/api", (_, response: Response) => response.status(404).send());

  // allows urls like /, /@TIM, /#TEA, /#TIM@TEA, or /@TEA#TIM
  // serves the index page. webui script will recognize team and player IDs in URL.
  const playerTeamRegex = /^\/(\@[a-zA-Z0-9]{3}|\#[a-zA-Z0-9]{3}|\@[a-zA-Z0-9]{3}\#[a-zA-Z0-9]{3}|\#[a-zA-Z0-9]{3}\@[a-zA-Z0-9]{3})?$/;
  app.get(playerTeamRegex, (_, response: Response) =>
    response.sendFile(indexFile)
  );

  // serve assets
  app.use(
    "/assets",
    Express.static(path.join(__dirname, "/../../static"), {
      dotfiles: "ignore",
      maxAge: "1d",
    })
  );
  app.all("/favicon.ico", (_, response) => {
    response.sendFile(path.join(__dirname, "..", "..", "static", "favicon.ico"));
  });

  // fallback for all other URLs
  app.all("/*", (_, response: Response) => response.status(404).send());

  await buildServer(app);
};

run();
