import Preact from "preact";
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
  shouldBeMining: boolean;
}

export class MiningProvider extends Preact.Component<any, IState> {
  private miner?: Miner;
  public state: IState = {
    hashRate: 0,
    player: "UNK",
    previousHash: "0",
    target: "00000",
    shouldBeMining: false,
  };

  public render = (props, state) => {
    return (
      <MiningContext.Provider
        value={{
          hashRate: state.hashRate,
          isMining: state.isMining,
          player: state.player,
          previousHash: "",
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
      shouldBeMining: true,
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

  private stopMining = () => {
    if (this.miner) {
      this.miner.terminate();
      this.miner = undefined;
      this.setState({
        shouldBeMining: false,
      });
    }
  };
}
