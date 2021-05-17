import { getBlocks } from "./Api";
import { Block } from "./Block";
import { Game } from "./Game";
import { connectWebSocket } from "./Socket";

const logUI = document.getElementById("log");
const logInUI = (message: string) => {
  const node = document.createElement("div");
  node.append(message);
  logUI.appendChild(node);
};

const getTeam = (input: string): string => {
  const teamRegex = /\#[A-Za-z0-9][A-Za-z0-9][A-Za-z0-9]/;
  const teamMatches = input.match(teamRegex);
  if (Array.isArray(teamMatches) && teamMatches.length > 0) {
    return teamMatches[0].slice(1);
  } else {
    return "";
  }
};
const team = getTeam(window.location.href);
logInUI(`Team: ${team || "No Team"}`);

const getPlayer = (input: string): string => {
  const playerRegex = /\@[A-Za-z0-9][A-Za-z0-9][A-Za-z0-9]/;
  const playerMatches = input.match(playerRegex);
  if (Array.isArray(playerMatches) && playerMatches.length > 0) {
    return playerMatches[0].slice(1);
  } else {
    return "UNK";
  }
};
const player = getPlayer(window.location.href);
logInUI(`Player: ${player || "No Player"}`);

const run = async () => {
  console.log("Getting recent blocks...");
  const recentBlocks = await getBlocks();
  let previousHash: string;

  if (recentBlocks.length === 0) {
    console.log("...no recent block.");
    logInUI("No Recent Blocks");
    previousHash = "0";
  } else {
    console.log(`...found ${recentBlocks.length} blocks.`);
    logInUI(`Found ${recentBlocks.length} blocks.`);
    logInUI(JSON.stringify(recentBlocks.slice(-2)));
    previousHash = recentBlocks[recentBlocks.length - 1].hashCode;
  }

  console.log("Starting Game...");
  logInUI("Starting");
  const game = new Game(player, team);
  game.mine(previousHash);

  const socket = await connectWebSocket(`ws://${location.host}`);
  socket.onmessage = (messageEvent: MessageEvent) => {
    const message = JSON.parse(messageEvent.data);
    console.log(`New Message: ${JSON.stringify(message, undefined, 2)}`);
    switch (message.event) {
      case "block-found":
        const block = message.data.block as Block;
        if (block.team) {
          logInUI(
            `New block from #${block.team}@${block.player}: ${block.hashCode}`
          );
          console.log(
            `New block from #${block.team}@${block.player}: ${block.hashCode}`
          );
        } else {
          logInUI(`New block from @${block.player}: ${block.hashCode}`);
          console.log(`New block from @${block.player}: ${block.hashCode}`);
        }
        game.mine(block.hashCode);
    }
  };
  return "Running...";
};

run().then(console.log).catch(console.error);
