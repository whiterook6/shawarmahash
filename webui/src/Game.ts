import { Block } from "./Block";
import Miner from "worker-loader!./Worker";
import { submitBlock } from "./Api";

export class Game {
  private previousHash: string | undefined;
  private miner: Miner | undefined;

  public team: string;
  public player: string;

  constructor(player: string, team: string = "") {
    if (team) {
      console.log(`Playing as #${team}@${player}.`);
    } else {
      console.log(`Playing as @${player}.`);
    }

    this.player = player;
    this.team = team;
  }

  public changeID = (newPlayer: string, newTeam: string = "") => {
    this.player = newPlayer;
    this.team = newTeam;

    this.mine(this.previousHash, true);
    if (newTeam) {
      console.log(`Playing as #${newTeam}@${newPlayer}.`);
    } else {
      console.log(`Playing as @${newPlayer}.`);
    }
  };

  public mine = (previousHash: string, reload: boolean = false) => {
    // already mining this block?
    if (previousHash === this.previousHash && !reload) {
      console.log(`Already mining with previous hash: ${previousHash}`);
      return;
    }

    console.log(`Begin mining with previous hash: ${previousHash}`);

    // kill an existing miner if needed
    if (this.miner) {
      console.log("Killing existing miner.");
      this.miner.terminate();
    }

    // start mining
    this.previousHash = previousHash;
    this.miner = new Miner();
    this.miner.onmessage = this.onMessage;

    const unfinishedBlock = this.beginBlock(previousHash);
    console.log(
      `Sending unfinished block to miner: ${JSON.stringify(unfinishedBlock)}`
    );
    this.miner.postMessage({
      type: "begin-mining",
      block: unfinishedBlock,
      target: "00000",
    });
  };

  private onMessage = (event: MessageEvent) => {
    console.log("New message from webworker.");
    switch (event.data.type) {
      case "block-found":
        const foundBlock = event.data.block as Block;
        console.log("Miner found block");
        console.log(JSON.stringify(foundBlock));
        submitBlock(foundBlock);
        this.mine(foundBlock.hashCode);
        break;
    }
  };

  private beginBlock = (previousHash: string): Block => {
    console.log(`Starting block with previous hash: ${previousHash}`);
    return {
      hashCode: "",
      nonce: "",
      player: this.player,
      team: this.team,
      previousHash,
      timestamp: Math.floor(Date.now() / 1000),
    };
  };
}
