import * as Preact from "preact";
import Miner from "worker-loader!../Worker";
import { Block, mint } from "../Block";
import { BeginMiningMSG } from "../MessageTypes";
import { MiningContext } from "../services/MiningContext";

interface IState {
  hashRate: number; // hashes per second. We can convert to nice numbers like 4.5K later.
  player: string;
  previousHash: string;
  target: string;
  team?: string;
  isMining: boolean;
}

export class MiningProvider extends Preact.Component<any, IState> {
  private miner?: Miner;
  private onMinedBlock?: (block: Block) => unknown;

  constructor(props) {
    super(props);
    this.state = {
      hashRate: 0,
      player: "UNK",
      previousHash: "0",
      target: "00000",
      isMining: false,
    };
  }

  public componentWillUnmount(): void {
    this.stopMining();
  }

  public render = (props, state: IState) => {
    return (
      <MiningContext.Provider
        value={{
          hashRate: state.hashRate,
          isMining: () => this.state.isMining,
          player: state.player,
          previousHash: state.previousHash,
          target: state.target,
          team: state.team,

          setID: this.setID,
          startMining: this.startMining,
          stopMining: this.stopMining,
        }}
      >
        {props.children}
      </MiningContext.Provider>
    );
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
    this.setState({
      hashRate: 0,
      isMining: true,
    });
  };

  private onMinerMessage = async (event: MessageEvent) => {
    const message = event.data;
    switch (message.event) {
      case "nonce-found":
        const block: Block = mint(
          message.previousHash as string,
          message.nonce as string,
          this.state.player,
          this.state.team || ""
        );
        this.setState({
          hashRate: message.hashRate,
        });
        if (this.onMinedBlock) {
          this.onMinedBlock(block);
        }
        break;

      case "hash-rate":
        const hashRate = message.hashRate as number;
        this.setState({
          hashRate,
        });
    }
  };

  private setID = (player: string, team?: string) => {
    if (this.state.player !== player || this.state.team !== team) {
      this.setState({
        player,
        team,
      });
    }
  };

  private startMining = (
    previousHash: string,
    target: string,
    onMinedBlock: (newBlock: Block) => void
  ) => {
    if (
      this.state.previousHash !== previousHash ||
      this.state.target !== target ||
      !this.miner
    ) {
      this.onMinedBlock = onMinedBlock;
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
    }

    this.onMinedBlock = undefined;
    this.setState({
      hashRate: 0,
      isMining: false,
    });
  };
}
