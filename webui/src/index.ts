import { Api } from "./api";
import type {
  Block,
  MiningResponse,
  MiningSuccessResponse,
  MiningTarget,
  StartMiningRequest,
} from "./types";

/**
 * Example function showing how to set up the miner worker:
 * - Sets player to TIM and team to TST
 * - Gets the current mining target from the server
 * - Starts the miner
 * - When the miner responds with a hash, submits it to the server
 * - Prints the response to the console
 */
export async function setupMinerExample() {
  const player = "TIM";
  const team = "TST";

  console.log(
    `[Miner Setup] Initializing miner for player: ${player}, team: ${team}`,
  );

  // Create the worker
  const worker = new Worker(new URL("./miner.ts", import.meta.url), {
    type: "module",
  });
  console.log("[Miner Setup] Worker created");

  // Store the mining target so we can use previousHash when submitting
  let currentMiningTarget: MiningTarget | null = null;

  // Set up message listener for worker responses
  worker.addEventListener(
    "message",
    async (event: MessageEvent<MiningResponse>) => {
      const message = event.data;

      switch (message.type) {
        case "mining_progress":
          console.log(
            `[Mining Progress] Nonce: ${message.data.nonce}, ` +
              `Best Hash: ${message.data.bestHash}, ` +
              `Hashes/sec: ${message.data.hashesPerSecond}`,
          );
          break;

        case "mining_success":
          console.log(`[Mining Success] Found valid hash!`, message.data);
          if (currentMiningTarget) {
            await handleMiningSuccess(message, team, currentMiningTarget);
          } else {
            console.error(
              `[Error] No mining target stored, cannot submit block`,
            );
          }
          break;

        case "mining_error":
          console.error(`[Mining Error]`, message.data.message);
          break;

        case "mining_status":
          console.log(`[Mining Status]`, message.data.status);
          break;

        default:
          console.warn(`[Unknown Message]`, message);
      }
    },
  );

  // Set up error handler
  worker.addEventListener("error", (error) => {
    console.error("[Worker Error]", error);
  });

  try {
    // Get the current mining target from the server
    console.log(`[API] Fetching mining target for team: ${team}`);
    const miningTarget: MiningTarget = await Api.getTeam(team);
    console.log(`[API] Mining target received:`, miningTarget);

    // Store it for later use when submitting the block
    currentMiningTarget = miningTarget;

    // Start mining
    const startRequest: StartMiningRequest = {
      type: "start_mining",
      data: {
        previousHash: miningTarget.previousHash,
        previousTimestamp: miningTarget.previousTimestamp,
        player: player,
        team: team,
        difficulty: miningTarget.difficulty,
      },
    };

    console.log(`[Miner] Starting mining with request:`, startRequest);
    worker.postMessage(startRequest);
    console.log(`[Miner] Mining started`);
  } catch (error) {
    console.error("[Setup Error] Failed to initialize miner:", error);
    worker.terminate();
    throw error;
  }
}

/**
 * Handles a successful mining result by submitting the block to the server
 */
async function handleMiningSuccess(
  successMessage: MiningSuccessResponse,
  team: string,
  miningTarget: MiningTarget,
) {
  try {
    console.log(`[API] Submitting block to server...`);

    // Construct the block to submit
    // The previousHash should be from the mining target (the hash of the previous block)
    // Note: index will be calculated by the server, but we include 0 to satisfy TypeScript
    const block: Block = {
      index: 0, // Server will calculate the correct index
      previousHash: miningTarget.previousHash,
      player: successMessage.data.player,
      team: successMessage.data.team,
      timestamp: Math.floor(Date.now() / 1000), // Current timestamp in seconds
      nonce: successMessage.data.nonce,
      hash: successMessage.data.hash,
    };

    console.log(`[API] Submitting block:`, block);
    const response = await Api.submitBlock(team, block);
    console.log(`[API] Block submitted successfully!`, response);
    return response;
  } catch (error) {
    console.error(`[API Error] Failed to submit block:`, error);
    throw error;
  }
}
const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Missing #app root element");
}

setupMinerExample();
