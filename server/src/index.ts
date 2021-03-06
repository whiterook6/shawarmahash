import Express, { Request, Response } from "express";
import fs from "fs/promises";
import { Server } from "https";
import helmet from "helmet";
import { createServer as createHttps } from "https";
import { Socket } from "net";
import path from "path";
import { default as WebSocket, default as Websocket } from "ws";
import {
  buildDifficultyTargetString,
  calculateDifficulty,
  Chain,
  verifyChain,
} from "./Chain";
import { Game } from "./Game";

import { loadChain, makeDataDir, saveChain } from "./Serialize";
import { BlockFoundMSG } from "./MessageTypes";

type GameSocket = Websocket &
  Partial<{
    id: number;
    player: string;
    team: string;
  }>;

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

let nextID: 0;
const getNextID = () => nextID++;

const run = async () => {
  await makeDataDir();

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
  const app = Express();
  const indexFile = path.join(__dirname + "/../../static/index.html");
  app.use(Express.json());

  // security
  app.disable("x-powered-by");
  app.use(helmet());

  const websockets = new WebSocket.Server({
    noServer: true,
  });

  const getClients = () => websockets.clients as Set<GameSocket>;

  const broadcast = (message: { event: string }): Promise<any> => {
    const promises: Array<Promise<void>> = new Array();
    for (const client of getClients()) {
      promises.push(
        new Promise((resolve, reject) => {
          client.send(JSON.stringify(message), (error?: Error) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        })
      );
    }

    return Promise.all(promises);
  };

  websockets.on("connection", (client: GameSocket) => {
    client.id = getNextID();
    client.on("message", (message: any) => {
      console.log(message);
    });
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
        const player = request.params.playerID as string;
        if (typeof player !== "string" || player.length !== 3) {
          return response.status(400).send(`Invalid player name.`);
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

  app.get("/api/teams/:team", async (request: Request, response: Response) => {
    try {
      const team = request.params.team as string;
      if (typeof team !== "string" || team.length !== 3) {
        return response.status(400).send(`Invalid team name.`);
      }

      return response.status(200).send(game.getTeamScore(team).toString(10));
    } catch (error) {
      console.error(error);
      return response.status(503).send();
    }
  });

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
        if (height < 0) {
          return response.status(404).send();
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

  app.post("/api/blocks", async (request: Request, response: Response) => {
    let block;
    try {
      const possibleBlock = request.body;
      if (!possibleBlock || typeof possibleBlock !== "object") {
        return response.status(400).send("Invalid block: empty.");
      }

      try {
        block = game.addBlock(possibleBlock as object);
      } catch (error) {
        return response.status(400).send(error.message);
      }

      response.status(200).send({
        block,
        newTarget: game.getDifficultyTarget(),
      });
    } catch (error) {
      console.error(error);
      return response.status(503).send();
    }

    try {
      const target = game.getDifficultyTarget();
      await Promise.all([
        broadcast({
          event: "block-found",
          block,
          difficultyTarget: target,
        } as BlockFoundMSG),
        saveChain(game.getChain()),
      ]);
    } catch (error) {
      console.error(error);
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

  // fallback for all other URLs
  app.all("/*", (_, response: Response) => response.status(404).send());

  const server = await buildServer(app);
  server.on("upgrade", (request: Request, socket: Socket, head: Buffer) => {
    websockets.handleUpgrade(request, socket, head, (websocket: WebSocket) => {
      websockets.emit("connection", websocket, request);
    });
  });
};

run();
