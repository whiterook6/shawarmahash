import path from "path";
import Express, { Request, Response } from "express";
import { Socket } from "net";
import { default as WebSocket, default as Websocket } from "ws";
import { Game } from "./Game";
import { IncChangeName, IncChangeTeam, IncChat, OutBlockFound, OutChat } from "./MessageTypes";
import { calculateDifficulty } from "./Chain";

type GameSocket = Websocket & Partial<{
  id: number;
  player: string;
  team: string;
}>

let nextID: 0;
const getNextID = () => nextID++;

const run = () => {
  const game = new Game();
  const app = Express();
  app.use(Express.json());

  const websockets = new WebSocket.Server({
    noServer: true
  });

  const getClients = () => websockets.clients as Set<GameSocket>;

  const broadcast = (message: {event: string, data: any}): Promise<any> => {
    console.log(message);
    const promises: Array<Promise<void>> = new Array();
    for (const client of getClients()){
      promises.push(new Promise((resolve, reject) => {
        client.send(JSON.stringify(message), (error?: Error) => {
          if (error){
            reject(error);
          } else {
            resolve();
          }
        })
      }));
    }

    return Promise.all(promises);
  }

  websockets.on("connection", (client: GameSocket) => {
    client.id = getNextID();
    client.on("message", (message: any) => {
      switch (message.event){
        case "change-name":
          const newName = (message as IncChangeName).data.newName;
          client.player = newName.substring(0, 3);
          break;
        case "change-team":
          const newTeam = (message as IncChangeTeam).data.newTeam;
          client.team = newTeam.substring(0, 3)
          break;
        case "chat":
          const chatMessage = (message as IncChat).data.message;
          broadcast({
            event: "chat",
            data: {
              from: client.player || "UNK",
              message: chatMessage
            }
          } as OutChat)
          break;
        case "leave-team":
          client.team = undefined;
          break;
      }
    })
  })
  
  app.get("/api/players", async (_: Request, response: Response) => {
    try {
      return response.status(200).send(game.getPlayers());
    } catch (error){
      console.error(error);
      return response.status(503).send();
    }
  });
  
  app.get("/api/players/:player", async (request: Request, response: Response) => {
    try {
      const player = request.params.playerID as string;
      if (typeof(player) !== "string" || player.length !== 3){
        return response.status(400).send(`Invalid player name.`);
      }
      return response.status(200).send(game.getPlayerScore(player).toString(10));
    } catch (error){
      console.error(error);
      return response.status(503).send();
    }
  });
  
  app.get("/api/teams", async (_: Request, response: Response) => {
    try {
      return response.status(200).send(game.getTeams());
    } catch (error){
      console.error(error);
      return response.status(503).send();
    }
  });
  
  app.get("/api/teams/:team", async (request: Request, response: Response) => {
    try {
      const team = request.params.team as string;
      if (typeof(team) !== "string" || team.length !== 3){
        return response.status(400).send(`Invalid team name.`);
      }

      return response.status(200).send(game.getTeamScore(team).toString(10));
    } catch (error){
      console.error(error);
      return response.status(503).send();
    }
  });
  
  app.get("/api/blocks/recent", async (_: Request, response: Response) => {
    try {
      return response.status(200).send(game.getRecentBlocks());
    } catch (error){
      console.error(error);
      return response.status(503).send();
    }
  });
  
  app.get("/api/blocks/:height", async (request: Request, response: Response) => {
    try {
      const height = parseInt(request.params.height, 10);
      const chainHeight = game.getHeight();
      if (height > chainHeight){
        return response.status(200).send(game.getBlockAt(height));
      } else {
        return response.status(404).send();
      }
    } catch (error){
      console.error(error);
      return response.status(503).send();
    }
  });

  app.post("/api/blocks", async (request: Request, response: Response) => {
    try {
      const possibleBlock = request.body;
      if (!possibleBlock || typeof(possibleBlock) !== "object"){
        return response.status(400).send("Invalid block: empty.");
      }

      let block;
      try {
        block = game.addBlock(possibleBlock as object);
      } catch (error){
        return response.status(400).send(error.message);
      }

      const height = game.getHeight();
      broadcast({
        event: "block-found",
        data: {
          block,
          height
        }
      } as OutBlockFound);
      
      // if (height % 100 === 0){
      //   broadcast({
      //     event: "target",
      //     data: {
      //       target: game.getTargetDifficulty()
      //     }
      //   })
      // }
      
      return response.status(200).send(block);
    } catch (error){
      console.error(error);
      return response.status(503).send();
    }
  });

  app.get('/', function(_, response: Response) {
    response.sendFile(path.join(__dirname + "/../../static/index.html"));
  });

  app.use("/api", (_, response: Response) => response.status(404).send());

  app.use("/assets", Express.static(path.join(__dirname, "/../../static"), {
    dotfiles: "ignore",
    maxAge: "1d",
  }));

  const httpServer = app.listen(8080, () => {
    console.log("Server running.");
  });

  httpServer.on('upgrade', (request: Request, socket: Socket, head: Buffer) => {
    websockets.handleUpgrade(request, socket, head, (socket: WebSocket) => {
      websockets.emit('connection', socket, request);
    });
  });
};

run();