import { Component } from "preact";
import Miner from "worker-loader!../Worker";
import { submitBlock } from "../Api";
import { Block, getBlockHash } from "../Block";
import { GameContext } from "./GameContext";

interface GameState {
  hashRate: number; // hashes per second. We can convert to nice numbers like 4.5K later.
  player: string;
  previousHash: string;
  target: string;
  team?: string;
}

export class Game extends Component<any, GameState> {
  private miner?: Miner;
  private webSocket?: WebSocket;

  constructor(props: any){
    super(props);

    this.state = {
      hashRate: 0,
      player: "UNK",
      previousHash: "0",
      target: "0000000000",
      team: undefined,
    };
    this.connectWebsocket();
  }

  public render = (props, state) => {
    return <GameContext.Provider value={{
      ...state,
      isMining: this.miner !== undefined,
      setID: this.setID,
      startMining: this.startMining,
      stopMining: this.stopMining
    }}>{props.children}</GameContext.Provider>
  }

  private setID = (player: string, team?: string) => {
    if (this.state.player !== player || this.state.team !== team) {
      this.setState({
        player,
        team
      });
    }
  };

  private startMining = (previousHash: string, target: string) => {
    if (this.state.previousHash !== previousHash || this.state.target !== target) {
      this.mine(previousHash, target);
      this.setState({
        previousHash,
        target
      });
    }
  }

  private stopMining = () => {
    if (this.miner) {
      this.miner.terminate();
      this.miner = undefined;
      this.forceUpdate();
    }
  }

  private mine = (previousHash: string, target: string) => {
    if (this.miner){
      this.miner.terminate();
    }

    this.miner = new Miner();
    this.miner.onmessage = this.onMinerMessage;

    this.miner.postMessage({
      type: "begin-mining",
      previousHash,
      target
    });
  }

  private onMinerMessage = async (event: MessageEvent) => {
    switch (event.data.type){
      case "nonce-found":
        const block: Block = {
          previousHash: event.data.previousHash as string,
          player: this.state.player,
          team: this.state.team || "",
          timestamp: Math.floor(Date.now() / 1000),
          nonce: event.data.nonce as string,
          hashCode: "",
        }
        block.hashCode = getBlockHash(block);
        await submitBlock(block);
        this.mine(block.hashCode, this.state.target);
        
      case "hash-rate":
        const hashRate = event.data.hashRate as number;
        this.setState({
          hashRate
        });
    }
  }

  private connectWebsocket = () => {
    if (this.webSocket){
      this.webSocket.close();
    }

    this.webSocket = new WebSocket(`ws://localhost:8080/`);
    this.webSocket.onopen = this.onWebSocketOpen;
  }

  private onWebSocketOpen = (event: Event) => {
    if (this.webSocket){
      console.log("Websocket open");
      this.webSocket.onmessage = this.onWebSocketMessage;
      this.webSocket.onclose = this.onWebSocketClose;
    }
  }

  private onWebSocketMessage = (event: MessageEvent) => {
    const message = JSON.parse(event.data);
    console.log("Websocket message", event.data);
    switch (message.event){
      case "block-found":
        const block = message.data.block as Block;
        const target = message.data.target as string;
        this.mine(block.previousHash, target);
        break;
    }
  }

  private onWebSocketClose = (event: Event) => {
    this.webSocket = undefined;
  }
}