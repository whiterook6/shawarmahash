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

  public state: GameState = {
    hashRate: 0,
    player: "UNK",
    previousHash: "0",
    target: "000000",
    team: undefined,
  };
  
  public setPlayer = (player: string) => {
    if (this.state.player !== player){
      this.setState({
        player
      });
    }
  };
  
  public setTeam = (team?: string) => {
    if (this.state.team !== team){
      this.setState({
        team
      });
    }
  };

  public startMining = (previousHash: string, target: string) => {
    if (this.state.previousHash !== previousHash || this.state.target !== target){
      this.mine(previousHash, target);
      this.setState({
        previousHash,
        target
      });
    }
  }

  public stopMining = () => {
    if (this.miner){
      this.miner.terminate();
      this.miner = undefined;
    }
  }

  public render = (props, state) => {
    return <GameContext.Provider value={{
      ...state,
      isMining: this.miner !== undefined,
      setPlayer: this.setPlayer,
      setTeam: this.setTeam,
      startMining: this.startMining,
      stopMining: this.stopMining
    }}>{props.children}</GameContext.Provider>
  }

  private mine = (previousHash: string, target: string) => {
    if (this.miner){
      this.miner.terminate();
    }

    this.miner = new Miner();
    this.miner.onmessage = this.fromMiner;

    this.miner.postMessage({
      type: "begin-mining",
      previousHash,
      target
    });
  }

  private fromMiner = (event: MessageEvent) => {
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
        this.stopMining();
        submitBlock(block);
        
      case "hash-rate":
        const hashRate = event.data.hashRate as number;
        this.setState({
          hashRate
        });
    }
  }
}