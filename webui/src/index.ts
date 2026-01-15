import { EventService } from "./services/events";
import { MinerService } from "./services/miner";
import { PlayerService } from "./services/players";
import { TeamService } from "./services/team";
import type { HashFoundMessage, ProgressMessage } from "./services/types";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Missing #app root element");
}

// Mining state
let isMining = false;
let currentHashesPerSecond = 0;
let lastHashFound: HashFoundMessage | null = null;
let currentMiningParams: {
  team: string;
  player: string;
  previousHash: string;
  previousTimestamp: number;
  difficulty: string;
} | null = null;
let submissionStatus: {
  status: "idle" | "submitting" | "success" | "error";
  message?: string;
} | null = null;

// Event service state
let eventServiceConnected = false;
let mostRecentEvent: {
  type: string;
  payload: unknown;
  timestamp: number;
} | null = null;

// Configuration
const MINING_TEAM = "TST";
const MINING_PLAYER = "TIM";

const updateStatusDisplay = () => {
  const statusDiv = document.getElementById("miner-status");
  if (!statusDiv) return;

  if (!isMining && !lastHashFound && !submissionStatus) {
    statusDiv.innerHTML = `
      <p><strong>Status:</strong> <span style="color: #666;">Idle</span></p>
      <p>Click "Start Mining" to begin.</p>
    `;
    return;
  }

  const statusHtml = `
    <p><strong>Status:</strong> <span style="color: ${isMining ? "#0a0" : "#666"}">${isMining ? "Mining..." : "Stopped"}</span></p>
    ${isMining ? `<p><strong>Hash Rate:</strong> ${currentHashesPerSecond.toFixed(2)} hashes/sec</p>` : ""}
    ${
      currentMiningParams
        ? `
      <p><strong>Team:</strong> ${currentMiningParams.team}</p>
      <p><strong>Player:</strong> ${currentMiningParams.player}</p>
      <p><strong>Difficulty:</strong> <code>${currentMiningParams.difficulty}</code></p>
    `
        : ""
    }
    ${
      submissionStatus
        ? `
      <div style="margin-top: 1rem; padding: 0.5rem; background: ${submissionStatus.status === "success" ? "#d4edda" : submissionStatus.status === "error" ? "#f8d7da" : "#fff3cd"}; border-radius: 4px; border: 1px solid ${submissionStatus.status === "success" ? "#c3e6cb" : submissionStatus.status === "error" ? "#f5c6cb" : "#ffeaa7"};">
        <p><strong>Submission:</strong> <span style="color: ${submissionStatus.status === "success" ? "#155724" : submissionStatus.status === "error" ? "#721c24" : "#856404"}">${submissionStatus.status === "submitting" ? "Submitting..." : submissionStatus.status === "success" ? "Success!" : "Error"}</span></p>
        ${submissionStatus.message ? `<p>${submissionStatus.message}</p>` : ""}
      </div>
    `
        : ""
    }
    ${
      lastHashFound
        ? `
      <div style="margin-top: 1rem; padding: 0.5rem; background: #f0f0f0; border-radius: 4px;">
        <p><strong>Last Hash Found:</strong></p>
        <p><strong>Hash:</strong> <code>${lastHashFound.hash}</code></p>
        <p><strong>Nonce:</strong> ${lastHashFound.nonce.toLocaleString()}</p>
        <p><strong>Team:</strong> ${lastHashFound.team}</p>
        <p><strong>Player:</strong> ${lastHashFound.player}</p>
      </div>
    `
        : ""
    }
  `;
  statusDiv.innerHTML = statusHtml;
};

// Initialize services
const teamService = new TeamService();
const playerService = new PlayerService();
const minerService = new MinerService();
const eventService = new EventService("");

export const render = () => {
  app.innerHTML = `
    <main style="max-width: 1400px; margin: 2rem auto; padding: 1rem; font-family: system-ui, sans-serif;">
      <h1>ShawarmaHash Miner</h1>
      
      <div style="display: flex; gap: 2rem; margin-top: 2rem; align-items: flex-start;">
        <!-- Left Column: Mining -->
        <div style="flex: 1; min-width: 0;">
          <div style="margin-bottom: 1rem;">
            <button id="miner-toggle" style="padding: 0.75rem 1.5rem; font-size: 1rem; cursor: pointer; background: #007bff; color: white; border: none; border-radius: 4px;">
              Start Mining
            </button>
          </div>

          <div id="miner-status" style="padding: 1rem; background: #f9f9f9; border-radius: 4px; border: 1px solid #ddd;">
            <p><strong>Status:</strong> <span style="color: #666;">Idle</span></p>
            <p>Click "Start Mining" to begin.</p>
          </div>
        </div>

        <!-- Right Column: Event Service -->
        <div style="flex: 1; min-width: 0;">
          <div id="event-status" style="padding: 1rem; background: #f9f9f9; border-radius: 4px; border: 1px solid #ddd;">
            <p><strong>Event Service:</strong> <span id="event-connection-status" style="color: ${eventServiceConnected ? "#0a0" : "#dc3545"}">${eventServiceConnected ? "Connected" : "Disconnected"}</span></p>
            <div id="event-recent" style="margin-top: 0.5rem;">
              ${
                mostRecentEvent
                  ? `
                <p><strong>Most Recent Event:</strong></p>
                <p><strong>Type:</strong> ${mostRecentEvent.type}</p>
                <p><strong>Time:</strong> ${new Date(mostRecentEvent.timestamp).toLocaleTimeString()}</p>
                <details style="margin-top: 0.5rem;">
                  <summary style="cursor: pointer; color: #007bff;">View Payload</summary>
                  <pre style="margin-top: 0.5rem; padding: 0.5rem; background: #fff; border: 1px solid #ddd; border-radius: 4px; overflow-x: auto; font-size: 0.875rem;">${JSON.stringify(mostRecentEvent.payload, null, 2)}</pre>
                </details>
              `
                  : "<p>No events received yet.</p>"
              }
            </div>
          </div>
        </div>
      </div>
    </main>
  `;

  // Set up button handler
  const toggleButton = document.getElementById(
    "miner-toggle",
  ) as HTMLButtonElement | null;
  if (toggleButton) {
    toggleButton.addEventListener("click", async () => {
      if (isMining) {
        minerService.stopMining();
        isMining = false;
        toggleButton.textContent = "Start Mining";
        toggleButton.style.background = "#007bff";
        updateStatusDisplay();
      } else {
        // Fetch current team state from server
        toggleButton.disabled = true;
        toggleButton.textContent = "Loading...";

        try {
          const miningInfo = await teamService.getMiningInfo(MINING_TEAM);

          const params = {
            team: MINING_TEAM,
            player: MINING_PLAYER,
            previousHash: miningInfo.previousHash,
            previousTimestamp: miningInfo.previousTimestamp,
            difficulty: miningInfo.difficulty,
          };

          currentMiningParams = params;
          submissionStatus = null; // Clear previous submission status
          minerService.startMining(params);
          isMining = true;
          toggleButton.textContent = "Stop Mining";
          toggleButton.style.background = "#dc3545";
          toggleButton.disabled = false;
          updateStatusDisplay();
        } catch (error) {
          console.error("Failed to fetch mining info:", error);
          toggleButton.textContent = "Start Mining";
          toggleButton.style.background = "#007bff";
          toggleButton.disabled = false;
          submissionStatus = {
            status: "error",
            message: `Failed to fetch team state: ${error instanceof Error ? error.message : String(error)}`,
          };
          updateStatusDisplay();
        }
      }
    });
  }
};

// Set up event service subscription
const updateEventDisplay = () => {
  const connectionStatusEl = document.getElementById("event-connection-status");
  const eventRecentEl = document.getElementById("event-recent");

  if (connectionStatusEl) {
    connectionStatusEl.textContent = eventServiceConnected
      ? "Connected"
      : "Disconnected";
    connectionStatusEl.style.color = eventServiceConnected ? "#0a0" : "#dc3545";
  }

  if (eventRecentEl) {
    if (mostRecentEvent) {
      eventRecentEl.innerHTML = `
        <p><strong>Most Recent Event:</strong></p>
        <p><strong>Type:</strong> ${mostRecentEvent.type}</p>
        <p><strong>Time:</strong> ${new Date(mostRecentEvent.timestamp).toLocaleTimeString()}</p>
        <details style="margin-top: 0.5rem;">
          <summary style="cursor: pointer; color: #007bff;">View Payload</summary>
          <pre style="margin-top: 0.5rem; padding: 0.5rem; background: #fff; border: 1px solid #ddd; border-radius: 4px; overflow-x: auto; font-size: 0.875rem;">${JSON.stringify(mostRecentEvent.payload, null, 2)}</pre>
        </details>
      `;
    } else {
      eventRecentEl.innerHTML = "<p>No events received yet.</p>";
    }
  }
};

eventService.subscribe({
  send: (data: unknown) => {
    const event = data as { type: string; payload?: unknown; status?: string };

    // Handle connection event (has status directly, not in payload)
    if (event.type === "connection") {
      eventServiceConnected = event.status === "open";
      console.log("🔌 Event service connection:", event.status);
    } else {
      // Handle other events (block_submitted, team_created, etc.)
      mostRecentEvent = {
        type: event.type,
        payload: event.payload,
        timestamp: Date.now(),
      };

      console.log("📨 Event received:", event.type, event.payload);

      // Log block submissions specifically
      if (event.type === "block_submitted") {
        const payload = event.payload as {
          recent?: unknown[];
          difficulty?: string;
        };
        if (payload.recent && payload.recent.length > 0) {
          const latestBlock = payload.recent[payload.recent.length - 1] as {
            player?: string;
            team?: string;
            hash?: string;
          };
          console.log(
            `⛏️  Block mined by ${latestBlock.player || "unknown"} on team ${latestBlock.team || "unknown"}: ${latestBlock.hash?.substring(0, 16)}...`,
          );
        }
      }
    }

    updateEventDisplay();
  },
  close: () => {
    eventServiceConnected = false;
    console.log("🔌 Event service disconnected");
    updateEventDisplay();
  },
});

// Set up miner service callbacks before rendering
minerService.onHashFound(async (message: HashFoundMessage) => {
  console.log("✅ Hash found!", {
    hash: message.hash,
    nonce: message.nonce,
    team: message.team,
    player: message.player,
  });
  lastHashFound = message;
  isMining = false;

  const toggleButton = document.getElementById(
    "miner-toggle",
  ) as HTMLButtonElement | null;
  if (toggleButton) {
    toggleButton.textContent = "Start Mining";
    toggleButton.style.background = "#007bff";
    toggleButton.disabled = true;
  }

  // Submit block to server
  submissionStatus = { status: "submitting" };
  updateStatusDisplay();

  try {
    if (!currentMiningParams) {
      throw new Error("No mining parameters available");
    }

    const result = await teamService.submitBlock(message.team, {
      previousHash: currentMiningParams.previousHash,
      player: message.player,
      nonce: message.nonce,
      hash: message.hash,
    });

    submissionStatus = {
      status: "success",
      message: `Block submitted successfully! Chain now has ${result.recent.length} recent blocks. New difficulty: ${result.difficulty}`,
    };

    console.log("✅ Block submitted successfully:", result);
  } catch (error) {
    submissionStatus = {
      status: "error",
      message: `Failed to submit block: ${error instanceof Error ? error.message : String(error)}`,
    };
    console.error("❌ Failed to submit block:", error);
  }

  if (toggleButton) {
    toggleButton.disabled = false;
  }

  updateStatusDisplay();
});

minerService.onProgress((message: ProgressMessage) => {
  console.log(
    `⏱️  Mining progress: ${message.hashesPerSecond.toFixed(2)} hashes/sec`,
  );
  currentHashesPerSecond = message.hashesPerSecond;
  updateStatusDisplay();
});

render();

const logTeams = async () => {
  try {
    const teams = await teamService.getTeams();
    console.log("Teams:", teams);
  } catch (error) {
    console.error("Failed to load teams:", error);
  }
};

void logTeams();

const logPlayers = async () => {
  try {
    const players = await playerService.getPlayers();
    console.log("Players:", players);
  } catch (error) {
    console.error("Failed to load players:", error);
  }
};

void logPlayers();

if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    newModule?.render();
  });
}
