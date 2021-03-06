import { Request } from "express";
import { Server } from "http";
import Websocket from "ws";
import { Game } from "../game/Game";
import { IncChangeName, IncChangeTeam, IncChat, OutChat } from "./MessageTypes";

type GameSocket = Websocket & {
  id?: number;
  player?: string;
  team?: string;
}

export class WebsocketServer {
  private readonly server: Websocket.Server;
  private readonly game: Game;
  private nextID = 0;

  constructor(httpServer: Server, game: Game){
    this.server = new Websocket.Server({
      noServer: true
    });
    httpServer.on('upgrade', (request: Request, socket, head) => {
      this.server.handleUpgrade(request, socket, head, socket => {
        this.server.emit('connection', socket, request);
      });
    });
    this.game = game;

    this.server.on("connection", this.onConnection);
  }

  private onConnection = (client: GameSocket) => {
    client.id = this.getNextID();
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
          this.broadcast({
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

  public getClients = () => this.server.clients as Set<GameSocket>;

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
      if (client.player){
        playerNames.add(client.player);
      }
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

  public broadcast = (message: {event: string, data: any}): Promise<any> => {
    const promises: Array<Promise<void>> = new Array();
    for (const client of this.getClients()){
      promises.push(new Promise((resolve, reject) => {
        client.send(message, (error?: Error) => {
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
