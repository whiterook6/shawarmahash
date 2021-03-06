import Websocket from "ws";
import { Game } from "../game/Game";

export class WebsocketServer {
  private readonly server: Websocket.Server;
  private readonly game: Game;
  private nextID = 0;

  constructor(options: Websocket.ServerOptions, game: Game){
    this.server = new Websocket.Server(options);
    this.game = game;

    this.server.on("connection", (client: any) => {
      client.id = this.getNextID();
    });
  }

  private getNextID = () => {
    return this.nextID++;
  }

  public close = () => {
    return new Promise<void>((resolve, reject) => {
      this.server.close((error) => {
        if (error){
          reject(error);
        } else {
          resolve();
        }
      })
    });
  }

  public getClients = () => this.server.clients;

  public getClient = (id: number): Websocket | undefined => {
    for (const client of this.getClients()){
      if (client.id === id){
        return client;
      }
    }
    console.warn(`Couldn't find client with id ${id}`);
    return undefined;
  }

  public getPlayers = () => {
    const playerNames = new Set<string>();

    for (const client of this.getClients()) {
      playerNames.add(client.name);
    }

    return [...playerNames];
  }

  public getTeams = () => {
    const teamNames = new Set<string>();

    for (const client of this.getClients()){
      if (client.team){
        teamNames.add(client.team);
      }
    }

    return [...teamNames];
  }

  public broadcast = (data: any): Promise<any> => {
    const promises: Array<Promise<void>> = new Array();
    for (const client of this.getClients()){
      promises.push(new Promise((resolve, reject) => {
        client.send(data, (error?: Error) => {
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

  public kick = (id: number, message?: string) => {
    const client = this.getClient(id);
    if (client){
      client.close(0, message);
    }
  }
}
