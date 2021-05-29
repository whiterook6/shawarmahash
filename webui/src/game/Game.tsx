import { Component } from "preact";
import Miner from "worker-loader!../Worker";
import { getBlocks, submitBlock } from "../services/Api";
import { Block, getBlockHash } from "../Block";
import { BeginMiningMSG } from "../MessageTypes";
import { MiningContext } from "../services/MiningContext";
import { WebsocketProvider } from "./WebsocketProvider";

interface GameState {
  hashRate: number; // hashes per second. We can convert to nice numbers like 4.5K later.
  player: string;
  previousHash: string;
  target: string;
  team?: string;
}

export class Game extends Component<any, GameState> {
  private miner?: Miner;

  constructor(props: any) {
    super(props);

    this.state = {
      hashRate: 0,
      player: "UNK",
      previousHash: "0",
      target: "0000000000",
      team: undefined,
    };
  }

  public render = (props, state) => {
    return (
      <WebsocketProvider>
        <MiningContext.Provider
          value={{
            ...state,
            isMining: this.miner !== undefined,
            setID: this.setID,
            startMining: this.startMining,
            stopMining: this.stopMining,
          }}
        >
          {props.children}
        </MiningContext.Provider>
      </WebsocketProvider>
    );
  };

  private setID = (player: string, team?: string) => {
    if (this.state.player !== player || this.state.team !== team) {
      this.setState({
        player,
        team,
      });
    }
  };

  private startMining = (previousHash: string, target: string) => {
    if (
      this.state.previousHash !== previousHash ||
      this.state.target !== target ||
      !this.miner
    ) {
      this.mine(previousHash, target);
      this.setState({
        previousHash,
        target,
      });
    }
  };

  private stopMining = () => {
    if (this.miner) {
      this.miner.terminate();
      this.miner = undefined;
      this.forceUpdate();
    }
  };

  private mine = (previousHash: string, target: string) => {
    if (this.miner) {
      this.miner.terminate();
    }

    this.miner = new Miner();
    this.miner.onmessage = this.onMinerMessage;

    this.miner.postMessage({
      event: "begin-mining",
      previousHash,
      difficultyTarget: target,
    } as BeginMiningMSG);
  };

  private onMinerMessage = async (event: MessageEvent) => {
    const message = event.data;
    switch (message.event) {
      case "nonce-found":
        const block: Block = {
          previousHash: message.previousHash as string,
          player: this.state.player,
          team: this.state.team || "",
          timestamp: Math.floor(Date.now() / 1000),
          nonce: message.nonce as string,
          hashCode: "",
        };

        block.hashCode = getBlockHash(block);
        this.setState({
          hashRate: message.hashRate,
        });

        try {
          await submitBlock(block);
          this.mine(block.hashCode, this.state.target);
        } catch (error) {
          const blocks = await getBlocks();
          if (blocks.length > 0) {
            const top = blocks[blocks.length - 1];
            this.mine(top.hashCode, this.state.target);
          } else {
            this.mine("0", this.state.target);
          }
        }
        break;

      case "hash-rate":
        const hashRate = message.hashRate as number;
        this.setState({
          hashRate,
        });
    }
  };
}
