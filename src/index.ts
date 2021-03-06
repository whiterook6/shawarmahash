import Express from "express";
import { Server } from "http";
import { Game } from "./game/Game";
import { APIServer } from "./server/APIServer";
import { WebsocketServer } from "./server/WebsocketServer";

const run = () => {
  const game = new Game();

  const app = Express();
  app.use(Express.json());
  
  const apiServer = new APIServer(app, game);
  const httpServer: Server = app.listen(8080, () => {
    console.log("Server listening on port 8080");
  })
  const websocketServer = new WebsocketServer(httpServer, game);
}

run();