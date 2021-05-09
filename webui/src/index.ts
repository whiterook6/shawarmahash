import { getBlocks } from "./Api";
import { Block } from "./Block";
import { Game } from "./Game";
import { connectWebSocket } from "./Socket";

const getTeam = (input: string): string => {
  const teamRegex = /\#[A-Za-z0-9][A-Za-z0-9][A-Za-z0-9]/;
  const teamMatches = input.match(teamRegex);
  if (teamMatches.length > 0) {
    return teamMatches[0].slice(1);
  } else {
    return "";
  }
};
const team = getTeam(window.location.href);

const getPlayer = (input: string): string => {
  const playerRegex = /\@[A-Za-z0-9][A-Za-z0-9][A-Za-z0-9]/;
  const playerMatches = input.match(playerRegex);
  if (playerMatches.length > 0) {
    return playerMatches[0].slice(1);
  } else {
    return "UNK";
  }
};
const player = getPlayer(window.location.href);

const run = async () => {
  console.log("Getting recent blocks...");
  const recentBlocks = await getBlocks();
  let previousHash: string;

  if (recentBlocks.length === 0) {
    console.log("...no recent block.");
    previousHash = "0";
  } else {
    console.log(`...found ${recentBlocks.length} blocks.`);
    previousHash = recentBlocks[recentBlocks.length - 1].hashCode;
  }

  console.log("Starting Game...");
  const game = new Game(player, team);
  game.mine(previousHash);

  const socket = await connectWebSocket(`ws://${location.host}`);
  socket.onmessage = (event: MessageEvent) => {
    console.log(`New message from websocket: ${event.data}`);
    const data = JSON.parse(event.data);
    switch (data.event) {
      case "block-found":
        const block = data.data.block as Block;
        if (block.team) {
          console.log(
            `New block from #${block.team}@${block.player}: ${block.hashCode}`
          );
        } else {
          console.log(`New block from @${block.player}: ${block.hashCode}`);
        }
        game.mine(block.hashCode);
    }
  };
  return "Running...";
};

run().then(console.log).catch(console.error);
