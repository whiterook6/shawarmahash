import Express, {Request, Response} from "express";
import { Block } from "../Block";
import { verifyIncomingBlock } from "../Chain";
import { Game } from "../game/Game";
/*
 * GET /api/players
 * GET /api/players/:player
 * GET /api/teams
 * GET /api/teams/:team
 * 
 * GET /api/blocks
 * GET /api/blocks/:height
 * POST /api/blocks
 */
export class APIServer {
  private readonly server;
  private readonly game: Game;

  constructor(game: Game){
    const server = Express();
    this.game = game;
    server.use(Express.json());
    
    server.get("/api/players", async (_: Request, response: Response) => {
      try {
        return response.status(200).send(this.game.getPlayers());
      } catch (error){
        console.error(error);
        return response.status(503).send();
      }
    });
    
    server.get("/api/players/:player", async (request: Request, response: Response) => {
      try {
        const player = request.body.playerID as string;
        if (typeof(player) !== "string" || player.length !== 3){
          return response.status(400).send(`Invalid team name.`);
        }
        return response.status(200).send(this.game.getPlayerScore(player));
      } catch (error){
        console.error(error);
        return response.status(503).send();
      }
    });
    
    server.get("/api/teams", async (_: Request, response: Response) => {
      try {
        return response.status(200).send(this.game.getTeams());
      } catch (error){
        console.error(error);
        return response.status(503).send();
      }
    });
    
    server.get("/api/teams/:team", async (request: Request, response: Response) => {
      try {
        const team = request.params.team as string;
        if (typeof(team) !== "string" || team.length !== 3){
          return response.status(400).send(`Invalid team name.`);
        }

        return response.status(200).send(this.game.getTeamScore(team));
      } catch (error){
        console.error(error);
        return response.status(503).send();
      }
    });
    
    server.get("/api/blocks/recent", async (_: Request, response: Response) => {
      try {
        return response.status(200).send(this.game.getRecentBlocks());
      } catch (error){
        console.error(error);
        return response.status(503).send();
      }
    });
    
    server.get("/api/blocks/:height", async (request: Request, response: Response) => {
      try {
        const height = parseInt(request.params.height, 10);
        const chainHeight = this.game.getHeight();
        if (height > chainHeight){
          return response.status(200).send(this.game.getBlockAt(height));
        } else {
          return response.status(404).send();
        }
      } catch (error){
        console.error(error);
        return response.status(503).send();
      }
    });

    server.post("/api/blocks", async (request: Request, response: Response) => {
      try {
        const possibleBlock = request.body;
        if (!possibleBlock || typeof(possibleBlock) !== "object"){
          return response.status(400).send("Invalid block: empty.");
        }

        let block;
        try {
          block = this.game.addBlock(possibleBlock as object);
        } catch (error){
          return response.status(400).send(error.message);
        }

        return response.status(200).send(block);
      } catch (error){
        console.error(error);
        return response.status(503).send();
      }
    });

    this.server = server;
  }

  public getServer = () => this.server;
}
